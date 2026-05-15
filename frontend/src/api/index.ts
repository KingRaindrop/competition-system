import { api, resolveUrl } from './client'
export { setToken, clearToken } from './client'
import type {
  User, Competition, Team, TeamMember, Registration,
  WorkFile, ScoringRubric, ReviewerAssignment,
  Review, ReviewDetail, Award, Notification, Feedback, InviteCode, SystemConfig,
} from '@/types'

// ==================== Auth ====================
export const authApi = {
  login(userId: string, password: string) {
    return api.post<{ token: string; user: User }>('/api/auth/login', { userId, password })
  },
  register(data: { userId: string; name: string; password: string; role?: string; college?: string; major?: string; grade?: string; email?: string; phone?: string; inviteCode?: string }) {
    return api.post<{ token: string; user: User }>('/api/auth/register', data)
  },
  me() {
    return api.get<User>('/api/auth/me')
  },
  updateProfile(data: Partial<User>) {
    return api.put<User>('/api/auth/profile', data)
  },
}

// ==================== Users ====================
export const userApi = {
  getAll() {
    return api.get<User[]>('/api/users')
  },
  getTeachers() {
    return api.get<User[]>('/api/users/teachers')
  },
  searchStudents(q: string) {
    return api.get<User[]>('/api/users/students', { q })
  },
  create(data: Partial<User> & { userId: string; name: string; role: string; college: string }) {
    return api.post<User>('/api/users', data)
  },
  update(id: string, data: Partial<User>) {
    return api.put<User>(`/api/users/${id}`, data)
  },
  updateStatus(id: string, status: 1 | 0) {
    return api.patch<User>(`/api/users/${id}/status`, { status })
  },
  remove(id: string) {
    return api.delete(`/api/users/${id}`)
  },
  ban(id: string) {
    return api.patch<User>(`/api/users/${id}/ban`)
  },
  unban(id: string) {
    return api.patch<User>(`/api/users/${id}/unban`)
  },
  getSystemConfig() {
    return api.get<SystemConfig>('/api/users/system/config')
  },
  updateSystemConfig(data: { schoolName?: string; colleges?: string[]; categories?: string[] }) {
    return api.put<SystemConfig>('/api/users/system/config', data)
  },
}

// ==================== Competitions ====================
export const competitionApi = {
  getAll(params?: { status?: string; category?: string; keyword?: string; creatorId?: string }) {
    return api.get<Competition[]>('/api/competitions', params as Record<string, string>)
  },
  getPublished() {
    return api.get<Competition[]>('/api/competitions/published')
  },
  getById(id: string) {
    return api.get<Competition>(`/api/competitions/${id}`)
  },
  create(data: Partial<Competition>) {
    return api.post<Competition>('/api/competitions', data)
  },
  update(id: string, data: Partial<Competition>) {
    return api.put<Competition>(`/api/competitions/${id}`, data)
  },
  submitForAudit(id: string) {
    return api.patch<Competition>(`/api/competitions/${id}/submit`)
  },
  approve(id: string) {
    return api.patch<Competition>(`/api/competitions/${id}/approve`)
  },
  reject(id: string, comment: string) {
    return api.patch<Competition>(`/api/competitions/${id}/reject`, { comment })
  },
  cancel(id: string) {
    return api.patch<Competition>(`/api/competitions/${id}/cancel`)
  },
  setStatus(id: string, status: string) {
    return api.patch<Competition>(`/api/competitions/${id}/status`, { status })
  },
  remove(id: string) {
    return api.delete(`/api/competitions/${id}`)
  },
}

// ==================== Teams ====================
export const teamApi = {
  getMine() {
    return api.get<Team[]>('/api/teams/mine')
  },
  getById(id: string) {
    return api.get<Team>(`/api/teams/${id}`)
  },
  create(name: string) {
    return api.post<Team>('/api/teams', { name })
  },
  inviteMember(teamId: string, studentId: string) {
    return api.post<TeamMember>(`/api/teams/${teamId}/members`, { studentId })
  },
  updateMemberStatus(teamId: string, memberId: string, status: string) {
    return api.patch(`/api/teams/${teamId}/members/${memberId}`, { status })
  },
  removeMember(teamId: string, memberId: string) {
    return api.delete(`/api/teams/${teamId}/members/${memberId}`)
  },
  removeTeam(teamId: string) {
    return api.delete(`/api/teams/${teamId}`)
  },
  getPendingInvitations() {
    return api.get<(TeamMember & { team: Team })[]>('/api/teams/invitations/pending')
  },
  getByCompetition(competitionId: string) {
    return api.get<Team[]>(`/api/teams/by-competition/${competitionId}`)
  },
}

// ==================== Registrations ====================
export const registrationApi = {
  getAll(params?: { competitionId?: string; studentId?: string }) {
    return api.get<Registration[]>('/api/registrations', params as Record<string, string>)
  },
  getById(id: string) {
    return api.get<Registration>(`/api/registrations/${id}`)
  },
  create(data: Partial<Registration>) {
    return api.post<Registration>('/api/registrations', data)
  },
  update(id: string, data: Partial<Registration>) {
    return api.put<Registration>(`/api/registrations/${id}`, data)
  },
  updateStatus(id: string, status: string) {
    return api.patch<Registration>(`/api/registrations/${id}/status`, { status })
  },
  setFinalist(id: string, isFinalist: boolean) {
    return api.patch<Registration>(`/api/registrations/${id}/finalist`, { isFinalist })
  },
  remove(id: string) {
    return api.delete(`/api/registrations/${id}`)
  },
  checkRegistered(competitionId: string) {
    return api.get<{ registered: boolean; registrationId?: string }>(`/api/registrations/check/${competitionId}`)
  },
}

// ==================== Files ====================
export const fileApi = {
  getFiles(registrationId: string) {
    return api.get<WorkFile[]>(`/api/files/${registrationId}`)
  },
  upload(registrationId: string, files: File[]) {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    return api.post<WorkFile[]>(`/api/files/${registrationId}`, formData)
  },
  remove(fileId: string) {
    return api.delete(`/api/files/delete/${fileId}`)
  },
  getDownloadUrl(fileId: string) {
    return resolveUrl(`/api/files/download/${fileId}`)
  },
}

// ==================== Reviews ====================
export const reviewApi = {
  getRubrics(competitionId: string) {
    return api.get<ScoringRubric[]>(`/api/reviews/rubrics/${competitionId}`)
  },
  saveRubrics(competitionId: string, rubrics: Omit<ScoringRubric, 'rubricId' | 'competitionId'>[]) {
    return api.put<ScoringRubric[]>(`/api/reviews/rubrics/${competitionId}`, { rubrics })
  },
  getReviewers(competitionId: string) {
    return api.get<ReviewerAssignment[]>(`/api/reviews/reviewers/${competitionId}`)
  },
  assignReviewers(competitionId: string, teacherIds: string[]) {
    return api.put<ReviewerAssignment[]>(`/api/reviews/reviewers/${competitionId}`, { teacherIds })
  },
  getMyAssignments() {
    return api.get<(ReviewerAssignment & { competition: Competition })[]>('/api/reviews/my-assignments')
  },
  getScores(registrationId: string) {
    return api.get<(Review & { details: ReviewDetail[] })[]>(`/api/reviews/scores/${registrationId}`)
  },
  getMyScore(registrationId: string) {
    return api.get<Review & { details: ReviewDetail[] }>(`/api/reviews/my-score/${registrationId}`)
  },
  saveScore(data: { registrationId: string; scores: { rubricId: string; score: number }[]; comment: string; submit: boolean }) {
    return api.post<Review & { details: ReviewDetail[] }>('/api/reviews/scores', data)
  },
  getProgress(competitionId: string) {
    return api.get<{ teacherId: string; done: number; total: number }[]>(`/api/reviews/progress/${competitionId}`)
  },
  getAverageScore(registrationId: string) {
    return api.get<{ averageScore: number; count: number }>(`/api/reviews/average/${registrationId}`)
  },
}

// ==================== Awards ====================
export const awardApi = {
  getAwards(competitionId: string) {
    return api.get<Award[]>(`/api/awards/${competitionId}`)
  },
  saveAwards(competitionId: string, awards: Omit<Award, 'awardId' | 'competitionId'>[]) {
    return api.put<Award[]>(`/api/awards/${competitionId}`, { awards })
  },
  assign(awardId: string, registrationId: string | null) {
    return api.patch<Award>(`/api/awards/${awardId}/assign`, { registrationId })
  },
  getResults(competitionId: string) {
    return api.get<any[]>(`/api/awards/competition/${competitionId}/results`)
  },
}

// ==================== Notifications ====================
export const notificationApi = {
  getAll() {
    return api.get<Notification[]>('/api/notifications')
  },
  getUnreadCount() {
    return api.get<{ count: number }>('/api/notifications/unread-count')
  },
  markRead(id: string) {
    return api.patch(`/api/notifications/${id}/read`)
  },
  markAllRead() {
    return api.patch('/api/notifications/read-all')
  },
}

// ==================== Invite Codes ====================
export const inviteCodeApi = {
  getAll() {
    return api.get<InviteCode[]>('/api/invite-codes')
  },
  create(data: { maxUses: number; colleges: string[]; count: number; role?: string }) {
    return api.post<InviteCode[]>('/api/invite-codes', data)
  },
  remove(code: string) {
    return api.delete(`/api/invite-codes/${code}`)
  },
  validate(code: string, college: string) {
    return api.post<{ valid: boolean }>('/api/invite-codes/validate', { code, college })
  },
}

// ==================== Feedbacks ====================
export const feedbackApi = {
  getAll() {
    return api.get<Feedback[]>('/api/feedbacks')
  },
  create(data: { title: string; content: string }) {
    return api.post<Feedback>('/api/feedbacks', data)
  },
  update(id: string, data: { adminReply?: string; status?: string }) {
    return api.patch<Feedback>(`/api/feedbacks/${id}`, data)
  },
}
