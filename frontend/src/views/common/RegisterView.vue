<template>
  <div class="login-page">
    <div class="login-card">
      <h1>注册账号</h1>
      <h2>{{ schoolName }}学科竞赛报名评审系统</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" style="margin-top: 24px;">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学号 / 工号" prop="userId">
              <el-input v-model="form.userId" placeholder="学号或工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="password2">
          <el-input v-model="form.password2" type="password" placeholder="再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="所属学院" prop="college">
          <el-select v-model="form.college" placeholder="请选择所属学院" style="width: 100%;" filterable>
            <el-option
              v-for="col in collegeOptions"
              :key="col"
              :label="col"
              :value="col"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请码" prop="inviteCode">
          <div style="display: flex; gap: 8px;">
            <el-input v-model="form.inviteCode" placeholder="请输入邀请码" style="flex: 1;" />
            <el-button :loading="validating" @click="validateCode" :disabled="!form.college">验证</el-button>
          </div>
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="form.major" placeholder="专业（选填）" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="邮箱（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleRegister" style="width: 100%;">
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="extra-links">
        <span>已有账号？</span>
        <el-link type="primary" @click="$router.push('/login')">返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { userApi, inviteCodeApi } from '@/api'
import type { FormInstance, FormRules } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const validating = ref(false)
const codeValidated = ref(false)
const formRef = ref<FormInstance>()
const schoolName = ref('')
const collegeOptions = ref<string[]>([])

const form = reactive({
  userId: '',
  name: '',
  password: '',
  password2: '',
  college: '',
  inviteCode: '',
  major: '',
  email: '',
  phone: '',
})

onMounted(async () => {
  try {
    const config = await userApi.getSystemConfig()
    collegeOptions.value = config.colleges
    schoolName.value = config.schoolName
  } catch { /* fallback to empty */ }
})

const validatePass2 = (_rule: any, value: string, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const validateInviteCode = (_rule: any, _value: string, callback: any) => {
  if (!codeValidated.value) {
    callback(new Error('请先验证邀请码'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  userId: [{ required: true, message: '请输入学号/工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  password2: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' },
  ],
  college: [{ required: true, message: '请选择所属学院', trigger: 'change' }],
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { validator: validateInviteCode, trigger: 'blur' },
  ],
}

async function validateCode() {
  if (!form.college || !form.inviteCode) return
  validating.value = true
  codeValidated.value = false
  try {
    await inviteCodeApi.validate(form.inviteCode, form.college)
    codeValidated.value = true
    ElMessage.success('邀请码验证通过')
  } catch (e: any) {
    codeValidated.value = false
    ElMessage.error(e?.message || '邀请码验证失败')
  } finally {
    validating.value = false
  }
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const ok = await auth.register({
    userId: form.userId,
    name: form.name,
    password: form.password,
    college: form.college,
    major: form.major,
    email: form.email,
    phone: form.phone,
    inviteCode: form.inviteCode,
  } as any)
  loading.value = false

  if (ok) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a3c4a 0%, #1a5276 50%, #1f6f8b 100%);
}
.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px 36px;
  width: 500px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.login-card h1 { font-size: 1.5em; color: #1a5276; margin-bottom: 4px; }
.login-card h2 { font-size: .92em; color: #909399; margin-bottom: 0; font-weight: 400; }
.extra-links { margin-top: -4px; font-size: .88em; color: #909399; }
</style>
