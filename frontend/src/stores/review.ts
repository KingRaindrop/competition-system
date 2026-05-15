import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Review, ReviewDetail, ReviewerAssignment, ScoringRubric, Award, WorkFile } from '@/types'
import { reviewApi, fileApi, awardApi } from '@/api'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<Review[]>([])
  const reviewDetails = ref<ReviewDetail[]>([])
  const rubrics = ref<ScoringRubric[]>([])
  const assignments = ref<ReviewerAssignment[]>([])
  const awards = ref<Award[]>([])
  const workFiles = ref<WorkFile[]>([])
  const averageScores = ref<Record<string, { averageScore: number; count: number }>>({})
  const progressMap = ref<Record<string, { teacherId: string; done: number; total: number }[]>>({})

  // ============ 评分标准 ============
  async function fetchRubrics(competitionId: string) {
    rubrics.value = await reviewApi.getRubrics(competitionId)
  }

  function getRubrics(competitionId: string): ScoringRubric[] {
    return rubrics.value.filter(r => r.competitionId === competitionId).sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async function saveRubrics(competitionId: string, items: Omit<ScoringRubric, 'rubricId' | 'competitionId'>[]) {
    rubrics.value = await reviewApi.saveRubrics(competitionId, items)
  }

  // ============ 评委指派 ============
  async function fetchReviewers(competitionId: string) {
    assignments.value = await reviewApi.getReviewers(competitionId)
  }

  function getReviewers(competitionId: string): ReviewerAssignment[] {
    return assignments.value.filter(a => a.competitionId === competitionId)
  }

  async function assignReviewers(competitionId: string, teacherIds: string[]) {
    assignments.value = await reviewApi.assignReviewers(competitionId, teacherIds)
  }

  function getMyReviewAssignments(teacherId: string): ReviewerAssignment[] {
    return assignments.value.filter(a => a.teacherId === teacherId)
  }

  // ============ 评分 ============
  async function fetchScores(registrationId: string) {
    const result = await reviewApi.getScores(registrationId)
    reviews.value = result.map(({ details: _details, ...review }) => review)
    reviewDetails.value = result.flatMap(r =>
      (r.details || []).map(d => ({ ...d }))
    )
  }

  async function fetchMyScore(registrationId: string) {
    return reviewApi.getMyScore(registrationId)
  }

  function getReview(registrationId: string, reviewerId: string): Review | undefined {
    return reviews.value.find(r => r.registrationId === registrationId && r.reviewerId === reviewerId)
  }

  function getReviewDetails(reviewId: string): ReviewDetail[] {
    return reviewDetails.value.filter(d => d.reviewId === reviewId)
  }

  async function saveReview(
    registrationId: string,
    scores: { rubricId: string; score: number }[],
    comment: string,
    submit: boolean,
  ) {
    const result = await reviewApi.saveScore({ registrationId, scores, comment, submit })
    // Update local state
    const idx = reviews.value.findIndex(r => r.registrationId === registrationId && r.reviewerId === result.reviewerId)
    if (idx >= 0) {
      reviews.value[idx] = result
    } else {
      reviews.value.push(result)
    }
    reviewDetails.value = reviewDetails.value.filter(d => d.reviewId !== result.reviewId)
    if (result.details) {
      result.details.forEach(d => reviewDetails.value.push({ ...d }))
    }
  }

  function getRegistrationReviews(registrationId: string): Review[] {
    return reviews.value.filter(r => r.registrationId === registrationId)
  }

  async function fetchAverageScore(registrationId: string) {
    const result = await reviewApi.getAverageScore(registrationId)
    averageScores.value[registrationId] = result
    return result
  }

  function getAverageScore(registrationId: string) {
    return averageScores.value[registrationId]?.averageScore || 0
  }

  async function fetchProgress(competitionId: string) {
    const result = await reviewApi.getProgress(competitionId)
    progressMap.value[competitionId] = result
    return result
  }

  function getReviewerProgress(competitionId: string): { teacherId: string; done: number; total: number }[] {
    return progressMap.value[competitionId] || []
  }

  // ============ 奖项 ============
  async function fetchAwards(competitionId: string) {
    awards.value = await awardApi.getAwards(competitionId)
  }

  function getAwards(competitionId: string): Award[] {
    return awards.value.filter(a => a.competitionId === competitionId)
  }

  async function saveAwards(competitionId: string, items: Omit<Award, 'awardId' | 'competitionId'>[]) {
    awards.value = await awardApi.saveAwards(competitionId, items)
  }

  async function assignAward(awardId: string, registrationId: string | null) {
    await awardApi.assign(awardId, registrationId)
    const award = awards.value.find(a => a.awardId === awardId)
    if (award) award.registrationId = registrationId || undefined
  }

  async function fetchResults(competitionId: string) {
    return awardApi.getResults(competitionId)
  }

  // ============ 作品文件 ============
  async function fetchWorkFiles(registrationId: string) {
    workFiles.value = await fileApi.getFiles(registrationId)
  }

  function getWorkFiles(registrationId: string): WorkFile[] {
    return workFiles.value.filter(f => f.registrationId === registrationId)
  }

  async function uploadFiles(registrationId: string, files: File[]) {
    const uploaded = await fileApi.upload(registrationId, files)
    workFiles.value.push(...uploaded)
  }

  async function removeWorkFile(fileId: string) {
    await fileApi.remove(fileId)
    workFiles.value = workFiles.value.filter(f => f.fileId !== fileId)
  }

  function addWorkFile(registrationId: string, file: Omit<WorkFile, 'fileId' | 'uploadedAt'>) {
    // 仅用于上传成功后的回调，fileId 由服务端返回
    const newFile: WorkFile = {
      ...file,
      fileId: '',
      registrationId,
      uploadedAt: new Date().toISOString(),
    }
    workFiles.value.push(newFile)
  }

  function clearWorkFiles(registrationId: string) {
    workFiles.value = workFiles.value.filter(f => f.registrationId !== registrationId)
  }

  return {
    reviews, reviewDetails, rubrics, assignments, awards, workFiles, averageScores, progressMap,
    fetchRubrics, getRubrics, saveRubrics,
    fetchReviewers, getReviewers, assignReviewers, getMyReviewAssignments,
    fetchScores, fetchMyScore, getReview, getReviewDetails, saveReview, getRegistrationReviews, fetchAverageScore, getAverageScore, fetchProgress, getReviewerProgress,
    fetchAwards, getAwards, saveAwards, assignAward, fetchResults,
    fetchWorkFiles, getWorkFiles, uploadFiles, removeWorkFile, clearWorkFiles, addWorkFile,
  }
})
