import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { User } from '@/types'
import { authApi, userApi, setToken, clearToken } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const initialized = ref(false)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const userRole = computed(() => currentUser.value?.role || null)

  async function login(userId: string, password: string): Promise<boolean> {
    try {
      const { token, user } = await authApi.login(userId, password)
      setToken(token)
      currentUser.value = user
      ElMessage.success('登录成功')
      return true
    } catch (e: any) {
      ElMessage.error(e?.message || '登录失败')
      return false
    }
  }

  async function register(data: { userId: string; name: string; password: string; college?: string; major?: string; grade?: string; email?: string; phone?: string; inviteCode?: string }): Promise<boolean> {
    try {
      const { token, user } = await authApi.register(data)
      setToken(token)
      currentUser.value = user
      ElMessage.success('注册成功，已自动登录')
      return true
    } catch (e: any) {
      ElMessage.error(e?.message || '注册失败')
      return false
    }
  }

  function logout() {
    currentUser.value = null
    clearToken()
  }

  async function fetchMe() {
    try {
      currentUser.value = await authApi.me()
    } catch {
      currentUser.value = null
      clearToken()
    } finally {
      initialized.value = true
    }
  }

  function setInitialized() {
    initialized.value = true
  }

  async function fetchAllUsers(): Promise<User[]> {
    try {
      users.value = await userApi.getAll()
    } catch {
      // fallback empty
    }
    return users.value
  }

  async function updateProfile(data: Partial<User>) {
    const updated = await authApi.updateProfile(data)
    currentUser.value = updated
  }

  async function saveUser(user: User) {
    const created = await userApi.create(user)
    users.value.push(created)
  }

  async function updateUserStatus(userId: string, status: 1 | 0) {
    await userApi.updateStatus(userId, status)
    const u = users.value.find(u => u.userId === userId)
    if (u) u.status = status
  }

  function isCompetitionCreator(_competitionId: string): boolean {
    // The competition store will handle this now
    return true
  }

  return {
    currentUser, users, isLoggedIn, userRole, initialized,
    login, register, logout, fetchMe, setInitialized, fetchAllUsers, updateProfile, saveUser, updateUserStatus, isCompetitionCreator,
  }
})
