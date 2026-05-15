<template>
  <div class="login-page">
    <div class="login-card">
      <h1>{{ schoolName }}</h1>
      <h2>学科竞赛报名评审系统</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" style="margin-top: 28px;">
        <el-form-item label="学号 / 工号" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入学号或工号" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width: 100%;">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="extra-links">
        <span>还没有账号？</span>
        <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import type { FormInstance, FormRules } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const schoolName = ref('')
const formRef = ref<FormInstance>()

onMounted(async () => {
  try {
    const config = await userApi.getSystemConfig()
    schoolName.value = config.schoolName
  } catch { /* keep empty */ }
})

const form = reactive({
  userId: '',
  password: '',
})

const rules: FormRules = {
  userId: [{ required: true, message: '请输入学号/工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  const ok = await auth.login(form.userId, form.password)
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
  padding: 48px 40px;
  width: 420px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.login-card h1 { font-size: 1.5em; color: #1a5276; margin-bottom: 4px; }
.login-card h2 { font-size: 1em; color: #606266; margin-bottom: 0; font-weight: 400; }
.extra-links { margin-top: 8px; font-size: .88em; color: #909399; }
</style>
