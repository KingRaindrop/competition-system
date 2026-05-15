<template>
  <div v-if="auth.currentUser">
    <h2 style="margin-bottom: 20px;">个人中心</h2>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div style="text-align: center;">
            <el-avatar :size="80" :icon="UserFilled" />
            <h3 style="margin-top: 12px;">{{ auth.currentUser.name }}</h3>
            <el-tag :type="roleTagType(auth.currentUser.role)">{{ roleText(auth.currentUser.role) }}</el-tag>
            <p style="margin-top: 8px; color: #909399;">{{ auth.currentUser.userId }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header><span>基本信息</span></template>
          <el-form label-width="100px">
            <el-form-item label="学号/工号">
              <el-input :model-value="auth.currentUser.userId" disabled />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input :model-value="auth.currentUser.name" disabled />
            </el-form-item>
            <el-form-item label="学院">
              <el-input v-model="profile.college" />
            </el-form-item>
            <el-form-item label="专业">
              <el-input v-model="profile.major" />
            </el-form-item>
            <el-form-item v-if="auth.currentUser.role === 'student'" label="年级">
              <el-input v-model="profile.grade" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profile.email" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profile.phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

const auth = useAuthStore()

const profile = reactive({
  college: '',
  major: '',
  grade: '',
  email: '',
  phone: '',
})

onMounted(() => {
  if (auth.currentUser) {
    profile.college = auth.currentUser.college || ''
    profile.major = auth.currentUser.major || ''
    profile.grade = auth.currentUser.grade || ''
    profile.email = auth.currentUser.email || ''
    profile.phone = auth.currentUser.phone || ''
  }
})

function roleText(role: UserRole): string {
  return { admin: '管理员', teacher: '教师', student: '学生' }[role]
}

function roleTagType(role: UserRole): 'danger' | 'primary' | 'success' {
  return { admin: 'danger', teacher: 'primary', student: 'success' }[role] as any
}

async function saveProfile() {
  if (!auth.currentUser) return
  await auth.updateProfile(profile)
  ElMessage.success('个人信息已更新')
}
</script>
