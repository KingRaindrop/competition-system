<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon> 新增用户</el-button>
    </div>

    <el-card style="margin-bottom: 16px;">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input v-model="keyword" placeholder="搜索学号/工号/姓名" clearable />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterRole" placeholder="角色筛选" clearable style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 100%;">
            <el-option label="正常" :value="1" />
            <el-option label="已停用" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="loadUsers">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-table :data="filteredList" stripe v-loading="loading">
      <el-table-column prop="userId" label="学号/工号" width="130" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column label="角色" width="80">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)" size="small">{{ roleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="college" label="学院" width="140" />
      <el-table-column prop="major" label="专业" width="140" />
      <el-table-column prop="grade" label="年级" width="80" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.status === 1" @change="(v: boolean) => toggleStatus(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm
            v-if="row.role === 'student'"
            :title="row.banned ? '确认解除该学生的参赛禁令？' : '确认禁止该学生参加所有竞赛？'"
            @confirm="toggleBan(row)"
          >
            <template #reference>
              <el-button size="small" :type="row.banned ? 'success' : 'warning'">
                {{ row.banned ? '解禁' : '禁赛' }}
              </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确认删除该用户？" @confirm="deleteUser(row.userId)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑用户' : '新增用户'" width="520px" @closed="resetForm">
      <el-form :model="userForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="学号/工号" prop="userId">
          <el-input v-model="userForm.userId" :disabled="editing" placeholder="学号或工号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="密码" :prop="editing ? undefined : 'password'">
          <el-input v-model="userForm.password" type="password" :placeholder="editing ? '留空则不修改密码' : '至少6位'" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%;">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="userForm.college" placeholder="所属学院" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="userForm.major" />
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="userForm.grade" placeholder="如：2024级" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import type { User, UserRole } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'

const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const filterRole = ref('')
const filterStatus = ref<number | ''>('')
const dialogVisible = ref(false)
const editing = ref(false)
const formRef = ref<FormInstance>()

const emptyForm = {
  userId: '',
  name: '',
  password: '',
  role: 'student' as UserRole,
  college: '',
  major: '',
  grade: '',
  email: '',
  phone: '',
}

const userForm = reactive({ ...emptyForm })

const formRules: FormRules = {
  userId: [{ required: true, message: '请输入学号/工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

onMounted(() => loadUsers())

async function loadUsers() {
  loading.value = true
  await auth.fetchAllUsers()
  loading.value = false
}

const filteredList = computed(() => {
  let list = auth.users
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(u => u.userId.toLowerCase().includes(kw) || u.name.toLowerCase().includes(kw))
  }
  if (filterRole.value) list = list.filter(u => u.role === filterRole.value)
  if (filterStatus.value !== '') list = list.filter(u => u.status === filterStatus.value)
  return list
})

function roleText(role: UserRole) {
  return { admin: '管理员', teacher: '教师', student: '学生' }[role]
}

function roleTagType(role: UserRole) {
  return { admin: 'danger', teacher: 'primary', student: 'success' }[role] as 'danger' | 'primary' | 'success'
}

async function toggleStatus(row: User, active: boolean) {
  await auth.updateUserStatus(row.userId, active ? 1 : 0)
  row.status = active ? 1 : 0
  ElMessage.success(active ? '已启用' : '已停用')
}

async function toggleBan(row: User) {
  try {
    if (row.banned) {
      await userApi.unban(row.userId)
      row.banned = false
      ElMessage.success('已解除禁赛')
    } else {
      await userApi.ban(row.userId)
      row.banned = true
      ElMessage.success('已禁止参赛')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

function openAdd() {
  editing.value = false
  dialogVisible.value = true
}

function openEdit(user: User) {
  editing.value = true
  Object.assign(userForm, {
    userId: user.userId,
    name: user.name,
    password: '',
    role: user.role,
    college: user.college,
    major: user.major || '',
    grade: user.grade || '',
    email: user.email || '',
    phone: user.phone || '',
  })
  dialogVisible.value = true
}

function resetForm() {
  editing.value = false
  Object.assign(userForm, emptyForm)
  formRef.value?.resetFields()
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editing.value) {
      const data: any = {
        name: userForm.name,
        role: userForm.role,
        college: userForm.college,
        major: userForm.major,
        grade: userForm.grade,
        email: userForm.email,
        phone: userForm.phone,
      }
      if (userForm.password) {
        data.password = userForm.password
      }
      await userApi.update(userForm.userId, data)
    } else {
      await userApi.create(userForm)
    }
    ElMessage.success(editing.value ? '已更新' : '已创建')
    dialogVisible.value = false
    await loadUsers()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function deleteUser(userId: string) {
  try {
    await userApi.remove(userId)
    ElMessage.success('已删除')
    await loadUsers()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>
