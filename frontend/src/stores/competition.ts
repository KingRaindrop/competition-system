import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Competition, CompetitionStatus } from '@/types'
import { competitionApi } from '@/api'
import { nowLocal } from '@/utils/format'

export const useCompetitionStore = defineStore('competition', () => {
  const competitions = ref<Competition[]>([])

  async function fetchAll(params?: { status?: string; category?: string; keyword?: string }) {
    competitions.value = await competitionApi.getAll(params)
  }

  async function fetchPublished() {
    competitions.value = await competitionApi.getPublished()
  }

  async function fetchByCreator(creatorId: string) {
    competitions.value = await competitionApi.getAll({ creatorId })
  }

  function all() { return competitions.value }

  function getById(id: string): Competition | undefined {
    return competitions.value.find(c => c.competitionId === id)
  }

  async function fetchById(id: string): Promise<Competition> {
    return competitionApi.getById(id)
  }

  function getByStatus(status: CompetitionStatus): Competition[] {
    return competitions.value.filter(c => c.status === status)
  }

  function getPublished(): Competition[] {
    return competitions.value.filter(c =>
      ['published', 'registering', 'reviewing', 'final', 'ended'].includes(c.status)
    )
  }

  function getByCreator(creatorId: string): Competition[] {
    return competitions.value.filter(c => c.creatorId === creatorId)
  }

  async function create(comp: Omit<Competition, 'competitionId' | 'createdAt' | 'updatedAt'>): Promise<Competition> {
    const newComp = await competitionApi.create(comp)
    competitions.value.unshift(newComp)
    return newComp
  }

  async function update(id: string, data: Partial<Competition>) {
    const updated = await competitionApi.update(id, data)
    const idx = competitions.value.findIndex(c => c.competitionId === id)
    if (idx >= 0) competitions.value[idx] = updated
  }

  async function submitForAudit(id: string) {
    const updated = await competitionApi.submitForAudit(id)
    const idx = competitions.value.findIndex(c => c.competitionId === id)
    if (idx >= 0) competitions.value[idx] = updated
  }

  async function approve(id: string) {
    const updated = await competitionApi.approve(id)
    const idx = competitions.value.findIndex(c => c.competitionId === id)
    if (idx >= 0) competitions.value[idx] = updated
  }

  async function reject(id: string, comment: string) {
    const updated = await competitionApi.reject(id, comment)
    const idx = competitions.value.findIndex(c => c.competitionId === id)
    if (idx >= 0) competitions.value[idx] = updated
  }

  async function cancel(id: string) {
    const updated = await competitionApi.cancel(id)
    const idx = competitions.value.findIndex(c => c.competitionId === id)
    if (idx >= 0) competitions.value[idx] = updated
  }

  async function remove(id: string) {
    await competitionApi.remove(id)
    competitions.value = competitions.value.filter(c => c.competitionId !== id)
  }

  async function refreshStatuses() {
    const now = nowLocal()
    for (const c of competitions.value) {
      let newStatus: CompetitionStatus | null = null
      if (c.status === 'published' && now >= c.regStart && now <= c.regEnd) newStatus = 'registering'
      else if (c.status === 'registering' && now > c.regEnd && now < c.reviewStart) newStatus = 'published'
      else if ((c.status === 'published' || c.status === 'registering') && now >= c.reviewStart && now <= c.reviewEnd) newStatus = 'reviewing'
      else if (c.status === 'reviewing' && now > c.reviewEnd && now < c.resultTime) newStatus = 'final'
      else if (c.status === 'final' && now >= c.resultTime) newStatus = 'ended'

      if (newStatus && newStatus !== c.status) {
        try {
          await competitionApi.setStatus(c.competitionId, newStatus)
          c.status = newStatus
        } catch { /* ignore */ }
      }
    }
  }

  async function startRegistration(id: string) {
    await competitionApi.setStatus(id, 'registering')
    const c = competitions.value.find(c => c.competitionId === id)
    if (c) c.status = 'registering'
  }

  async function startReview(id: string) {
    await competitionApi.setStatus(id, 'reviewing')
    const c = competitions.value.find(c => c.competitionId === id)
    if (c) c.status = 'reviewing'
  }

  async function startFinal(id: string) {
    await competitionApi.setStatus(id, 'final')
    const c = competitions.value.find(c => c.competitionId === id)
    if (c) c.status = 'final'
  }

  async function endCompetition(id: string) {
    await competitionApi.setStatus(id, 'ended')
    const c = competitions.value.find(c => c.competitionId === id)
    if (c) c.status = 'ended'
  }

  const pendingCount = computed(() => competitions.value.filter(c => c.status === 'pending').length)

  return {
    competitions, fetchAll, fetchPublished, fetchByCreator, all, getById, fetchById, getByStatus, getPublished, getByCreator,
    create, update, submitForAudit, approve, reject, cancel, remove,
    refreshStatuses, startRegistration, startReview, startFinal, endCompetition,
    pendingCount,
  }
})
