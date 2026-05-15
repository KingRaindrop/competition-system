import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Registration, RegistrationStatus } from '@/types'
import { registrationApi } from '@/api'
import { useTeamStore } from './team'

export const useRegistrationStore = defineStore('registration', () => {
  const registrations = ref<Registration[]>([])

  async function fetchByCompetition(competitionId: string) {
    registrations.value = await registrationApi.getAll({ competitionId })
  }

  async function fetchByStudent(studentId: string) {
    registrations.value = await registrationApi.getAll({ studentId })
  }

  function getByCompetition(competitionId: string): Registration[] {
    return registrations.value.filter(r => r.competitionId === competitionId)
  }

  function getByStudent(studentId: string): Registration[] {
    const teamStore = useTeamStore()
    return registrations.value.filter(r => {
      if (r.studentId === studentId) return true
      if (r.teamId) {
        const members = teamStore.getMembers(r.teamId)
        return members.some(m => m.studentId === studentId && m.status === 'accepted')
      }
      return false
    })
  }

  function getById(id: string): Registration | undefined {
    return registrations.value.find(r => r.registrationId === id)
  }

  async function fetchById(id: string): Promise<Registration> {
    return registrationApi.getById(id)
  }

  async function register(data: Omit<Registration, 'registrationId' | 'status' | 'createdAt'>): Promise<Registration> {
    const reg = await registrationApi.create(data)
    registrations.value.push(reg)
    return reg
  }

  async function updateStatus(id: string, status: RegistrationStatus) {
    const updated = await registrationApi.updateStatus(id, status)
    const idx = registrations.value.findIndex(r => r.registrationId === id)
    if (idx >= 0) registrations.value[idx] = updated
  }

  async function remove(id: string) {
    await registrationApi.remove(id)
    registrations.value = registrations.value.filter(r => r.registrationId !== id)
  }

  async function update(id: string, data: Partial<Registration>) {
    const updated = await registrationApi.update(id, data)
    const idx = registrations.value.findIndex(r => r.registrationId === id)
    if (idx >= 0) registrations.value[idx] = updated
  }

  function countByCompetition(competitionId: string): number {
    return registrations.value.filter(r => r.competitionId === competitionId).length
  }

  async function checkRegistered(competitionId: string): Promise<{ registered: boolean; registrationId?: string }> {
    try {
      return await registrationApi.checkRegistered(competitionId)
    } catch {
      return { registered: false }
    }
  }

  function isRegistered(studentId: string, competitionId: string): boolean {
    return registrations.value.some(r => {
      if (r.competitionId !== competitionId) return false
      if (r.studentId === studentId) return true
      return false
    })
  }

  return {
    registrations,
    fetchByCompetition, fetchByStudent,
    getByCompetition, getByStudent, getById, fetchById,
    register, updateStatus, remove, update, countByCompetition, checkRegistered, isRegistered,
  }
})
