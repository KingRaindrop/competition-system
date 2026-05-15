import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Feedback, FeedbackStatus } from '@/types'
import { feedbackApi } from '@/api'

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbacks = ref<Feedback[]>([])

  async function fetchAll() {
    feedbacks.value = await feedbackApi.getAll()
  }

  async function create(title: string, content: string): Promise<Feedback> {
    const fb = await feedbackApi.create({ title, content })
    feedbacks.value.unshift(fb)
    return fb
  }

  async function update(id: string, data: { adminReply?: string; status?: FeedbackStatus }) {
    const updated = await feedbackApi.update(id, data as { adminReply?: string; status?: string })
    const idx = feedbacks.value.findIndex(f => f.feedbackId === id)
    if (idx >= 0) feedbacks.value[idx] = updated
    return updated
  }

  return { feedbacks, fetchAll, create, update }
})
