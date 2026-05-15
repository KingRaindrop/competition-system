<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>评分汇总 — {{ comp.title }}</template>
    </el-page-header>

    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <span>去掉最高分和最低分：</span>
        <el-switch v-model="trimExtremes" />
        <el-divider direction="vertical" />
        <el-button @click="$router.push(`/teacher/finalists/${comp.competitionId}`)" type="warning">确定决赛名单</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="rankedList" stripe>
        <el-table-column label="排名" type="index" width="60" :index="(i: number) => i + 1" />
        <el-table-column prop="workTitle" label="作品名称" min-width="180" />
        <el-table-column label="参赛者" min-width="150">
          <template #default="{ row }">
            {{ row.teamId ? getTeamName(row.teamId) : getUserName(row.studentId) }}
          </template>
        </el-table-column>
        <el-table-column v-for="rubric in rubrics" :key="rubric.rubricId" :label="rubric.name" width="100">
          <template #default="{ row: reg }">
            {{ getAvgRubricScore(reg.registrationId, rubric.rubricId) }}
          </template>
        </el-table-column>
        <el-table-column label="平均分" width="100">
          <template #default="{ row }">
            <strong>{{ getDisplayScore(row.registrationId) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="评委评分详情" width="180">
          <template #default="{ row }">
            <el-popover placement="left" :width="300" trigger="click">
              <template #reference>
                <el-button size="small">查看详情</el-button>
              </template>
              <div v-for="rev in getRegistrationReviews(row.registrationId)" :key="rev.reviewId" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
                <p><strong>{{ getUserName(rev.reviewerId) }}</strong>：{{ rev.totalScore }} 分</p>
                <p v-if="rev.comment" style="font-size: .85em; color: #909399;">{{ rev.comment }}</p>
              </div>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useTeamStore } from '@/stores/team'
import { useReviewStore } from '@/stores/review'

const route = useRoute()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const teamStore = useTeamStore()
const reviewStore = useReviewStore()
const trimExtremes = ref(false)

const comp = computed(() => compStore.getById(route.params.id as string))
const rubrics = computed(() => comp.value ? reviewStore.getRubrics(comp.value.competitionId) : [])

const registeredList = computed(() => {
  if (!comp.value) return []
  return regStore.getByCompetition(comp.value.competitionId).filter(r => r.status === 'submitted')
})

function getDisplayScore(regId: string): string {
  const revs = reviewStore.getRegistrationReviews(regId).filter(r => r.status === 'submitted')
  if (revs.length === 0) return '-'
  let scores = revs.map(r => r.totalScore || 0)
  if (trimExtremes.value && scores.length >= 3) {
    scores.sort((a, b) => a - b)
    scores = scores.slice(1, -1)
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return avg.toFixed(1)
}

const rankedList = computed(() => {
  return [...registeredList.value].sort((a, b) => {
    const sa = parseFloat(getDisplayScore(a.registrationId))
    const sb = parseFloat(getDisplayScore(b.registrationId))
    return sb - sa
  })
})

function getAvgRubricScore(regId: string, rubricId: string): string {
  const revs = reviewStore.getRegistrationReviews(regId).filter(r => r.status === 'submitted')
  if (revs.length === 0) return '-'
  const details = revs.flatMap(r => reviewStore.getReviewDetails(r.reviewId).filter(d => d.rubricId === rubricId))
  if (details.length === 0) return '-'
  const avg = details.reduce((s, d) => s + d.score, 0) / details.length
  return avg.toFixed(1)
}

function getUserName(id?: string) { return id ? (auth.users.find(u => u.userId === id)?.name || id) : '-' }
function getTeamName(id: string) { return teamStore.getById(id)?.name || id }
function getRegistrationReviews(regId: string) { return reviewStore.getRegistrationReviews(regId) }
</script>
