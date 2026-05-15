import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Team, TeamMember, MemberStatus } from '@/types'
import { teamApi } from '@/api'

export const useTeamStore = defineStore('team', () => {
  const teams = ref<Team[]>([])
  const members = ref<TeamMember[]>([])

  async function fetchMine() {
    const result = await teamApi.getMine()
    teams.value = result
    for (const team of result) {
      if (team.members) {
        for (const m of team.members) {
          if (!members.value.find(ex => ex.id === m.id)) {
            members.value.push(m)
          }
        }
      }
    }
  }

  async function fetchById(teamId: string): Promise<Team> {
    return teamApi.getById(teamId)
  }

  function getByCaptain(captainId: string): Team[] {
    return teams.value.filter(t => t.captainId === captainId)
  }

  function getByStudent(studentId: string): Team[] {
    return teams.value.filter(t => {
      if (t.captainId === studentId) return true
      if (t.members) return t.members.some(m => m.studentId === studentId && m.status === 'accepted')
      return false
    })
  }

  function getById(teamId: string): Team | undefined {
    return teams.value.find(t => t.teamId === teamId)
  }

  function getMembers(teamId: string): TeamMember[] {
    return members.value.filter(m => m.teamId === teamId)
  }

  function getAcceptedMembers(teamId: string): TeamMember[] {
    return members.value.filter(m => m.teamId === teamId && m.status === 'accepted')
  }

  async function create(name: string): Promise<Team> {
    const team = await teamApi.create(name)
    teams.value.push(team)
    return team
  }

  async function inviteMember(teamId: string, studentId: string): Promise<TeamMember> {
    const tm = await teamApi.inviteMember(teamId, studentId)
    members.value.push(tm)
    return tm
  }

  async function updateMemberStatus(memberId: string, status: MemberStatus) {
    const member = members.value.find(m => m.id === memberId)
    const teamId = member?.teamId
    if (!teamId) return
    await teamApi.updateMemberStatus(teamId, memberId, status)
    if (member) member.status = status
  }

  async function removeMember(teamId: string, memberId: string) {
    await teamApi.removeMember(teamId, memberId)
    members.value = members.value.filter(m => m.id !== memberId)
  }

  async function removeTeam(teamId: string) {
    await teamApi.removeTeam(teamId)
    teams.value = teams.value.filter(t => t.teamId !== teamId)
    members.value = members.value.filter(m => m.teamId !== teamId)
  }

  async function fetchPendingInvitations() {
    return teamApi.getPendingInvitations()
  }

  async function fetchByCompetition(competitionId: string): Promise<Team[]> {
    const result = await teamApi.getByCompetition(competitionId)
    for (const team of result) {
      const idx = teams.value.findIndex(t => t.teamId === team.teamId)
      if (idx >= 0) {
        teams.value[idx] = team
      } else {
        teams.value.push(team)
      }
      if (team.members) {
        for (const m of team.members) {
          if (!members.value.find(ex => ex.id === m.id)) {
            members.value.push(m)
          }
        }
      }
    }
    return result
  }

  function getPendingInvitations(studentId: string): TeamMember[] {
    return members.value.filter(m => m.studentId === studentId && m.status === 'invited')
  }

  return {
    teams, members,
    fetchMine, fetchById,
    getByCaptain, getByStudent, getById, getMembers, getAcceptedMembers,
    create, inviteMember, updateMemberStatus, removeMember, removeTeam,
    fetchPendingInvitations, getPendingInvitations, fetchByCompetition,
  }
})
