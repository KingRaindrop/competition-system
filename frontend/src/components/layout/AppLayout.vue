<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #1a3c4a; overflow-y: auto;">
      <div class="logo-area">
        <h2>竞赛管理系统</h2>
        <p>{{ schoolName }}</p>
      </div>
      <AdminSidebar v-if="auth.userRole === 'admin'" />
      <TeacherSidebar v-else-if="auth.userRole === 'teacher'" />
      <StudentSidebar v-else-if="auth.userRole === 'student'" />
    </el-aside>
    <el-container>
      <el-header style="height: 56px; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 0 20px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-button circle :icon="Bell" @click="$router.push('/messages')" />
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <el-avatar :size="32" :icon="UserFilled" />
              <span>{{ auth.currentUser?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main style="background: #f0f2f5; padding: 20px;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Bell, UserFilled, ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useCompetitionStore } from '@/stores/competition'
import { userApi } from '@/api'
import AdminSidebar from './AdminSidebar.vue'
import TeacherSidebar from './TeacherSidebar.vue'
import StudentSidebar from './StudentSidebar.vue'

const auth = useAuthStore()
const notifStore = useNotificationStore()
const compStore = useCompetitionStore()
const router = useRouter()
const route = useRoute()
const schoolName = ref('XX大学')

const unreadCount = computed(() =>
  auth.currentUser ? notifStore.getUnreadCount(auth.currentUser.userId) : 0
)

onMounted(async () => {
  compStore.refreshStatuses()
  try {
    const config = await userApi.getSystemConfig()
    schoolName.value = config.schoolName || 'XX大学'
  } catch { /* keep default */ }
})

function handleCommand(cmd: string) {
  if (cmd === 'profile') router.push('/profile')
  else if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.logo-area {
  padding: 20px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,.1);
  color: #fff;
}
.logo-area h2 { font-size: 1.05em; margin-bottom: 4px; }
.logo-area p { font-size: .8em; opacity: .7; }
</style>
