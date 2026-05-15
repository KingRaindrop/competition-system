import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InviteCode } from '@/types'
import { inviteCodeApi } from '@/api'

export const useInviteCodeStore = defineStore('inviteCode', () => {
  const codes = ref<InviteCode[]>([])

  async function fetchAll() {
    codes.value = await inviteCodeApi.getAll()
  }

  async function generate(maxUses: number, colleges: string[], count: number, role?: string): Promise<InviteCode[]> {
    const created = await inviteCodeApi.create({ maxUses, colleges, count, role })
    codes.value.unshift(...created)
    return created
  }

  async function remove(code: string) {
    await inviteCodeApi.remove(code)
    codes.value = codes.value.filter(c => c.code !== code)
  }

  return { codes, fetchAll, generate, remove }
})
