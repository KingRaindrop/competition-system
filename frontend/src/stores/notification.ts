import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Notification } from '@/types'
import { notificationApi } from '@/api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)

  async function fetchAll() {
    notifications.value = await notificationApi.getAll()
  }

  async function fetchUnreadCount() {
    try {
      const { count } = await notificationApi.getUnreadCount()
      unreadCount.value = count
    } catch {
      unreadCount.value = 0
    }
  }

  function getByUser(userId: string): Notification[] {
    return notifications.value.filter(n => n.userId === userId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  function getUnreadCount(_userId: string): number {
    return unreadCount.value
  }

  async function markRead(notificationId: string) {
    await notificationApi.markRead(notificationId)
    const n = notifications.value.find(n => n.notificationId === notificationId)
    if (n) n.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    await notificationApi.markAllRead()
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
  }

  async function send(userId: string, title: string, content: string) {
    notifications.value.unshift({
      notificationId: 'local-' + Date.now(),
      userId,
      title,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    })
    unreadCount.value += 1
  }

  return { notifications, unreadCount, fetchAll, fetchUnreadCount, getByUser, getUnreadCount, markRead, markAllRead, send }
})
