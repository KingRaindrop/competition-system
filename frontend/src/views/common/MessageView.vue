<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>消息中心</h2>
      <el-button @click="markAllRead" :disabled="unreadCount === 0">全部已读</el-button>
    </div>

    <el-card v-if="list.length">
      <div v-for="n in list" :key="n.notificationId" style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 12px;">
        <el-badge :hidden="n.read" :is-dot="true" style="margin-top: 4px;" />
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong :style="{ color: n.read ? '#909399' : '#303133' }">{{ n.title }}</strong>
            <span style="font-size: .78em; color: #c0c4cc;">{{ formatDate(n.createdAt) }}</span>
          </div>
          <p style="margin-top: 4px; color: #909399; font-size: .9em;">{{ n.content }}</p>
          <el-button
            v-if="!n.read"
            size="small"
            text
            type="primary"
            style="margin-top: 4px;"
            @click="notifStore.markRead(n.notificationId)"
          >
            标记已读
          </el-button>
        </div>
      </div>
    </el-card>
    <el-empty v-else description="暂无消息" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { formatDate } from '@/utils/format'

const auth = useAuthStore()
const notifStore = useNotificationStore()

const list = computed(() => {
  if (!auth.currentUser) return []
  return notifStore.getByUser(auth.currentUser.userId)
})

const unreadCount = computed(() => {
  if (!auth.currentUser) return 0
  return notifStore.getUnreadCount(auth.currentUser.userId)
})

function markAllRead() {
  if (!auth.currentUser) return
  notifStore.markAllRead()
}
</script>
