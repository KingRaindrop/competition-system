<template>
  <div>
    <h2 style="margin-bottom: 20px;">我的成绩</h2>
    <el-table v-if="list.length" :data="list" stripe v-loading="loading">
      <el-table-column prop="workTitle" label="作品名称" min-width="150" />
      <el-table-column label="竞赛名称" min-width="180">
        <template #default="{ row }">
          <el-link type="primary" @click="$router.push(`/competition/${row.competitionId}`)">
            {{ getCompTitle(row.competitionId) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="平均分" width="100">
        <template #default="{ row }">{{ scores[row.registrationId]?.averageScore ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="获奖情况" width="120">
        <template #default="{ row }">
          <el-tag v-if="scores[row.registrationId]?.awardName" type="warning">{{ scores[row.registrationId].awardName }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="暂无成绩记录" />

    <!-- 成绩详情对话框 -->
    <el-dialog v-model="detailVisible" title="评分详情" width="600px">
      <template v-if="detailReg">
        <p><strong>作品名称：</strong>{{ detailReg.workTitle }}</p>
        <p><strong>竞赛：</strong>{{ getCompTitle(detailReg.competitionId) }}</p>
        <el-divider />
        <h4 style="margin-bottom: 12px;">评委评分</h4>
        <el-table :data="reviewList" size="small">
          <el-table-column label="评委" width="120">
            <template #default="{ row }">{{ getUserName(row.reviewerId) }}</template>
          </el-table-column>
          <el-table-column prop="totalScore" label="总分" width="80" />
          <el-table-column prop="comment" label="评语" min-width="200" show-overflow-tooltip />
          <el-table-column label="提交时间" width="140">
            <template #default="{ row }">{{ formatDate(row.submittedAt || '') }}</template>
          </el-table-column>
        </el-table>
        <p style="margin-top: 12px;">
          平均分：<strong>{{ detailAverageScore }}</strong>
        </p>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRegistrationStore } from '@/stores/registration'
import { useCompetitionStore } from '@/stores/competition'
import { useReviewStore } from '@/stores/review'
import { reviewApi } from '@/api'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const auth = useAuthStore()
const regStore = useRegistrationStore()
const compStore = useCompetitionStore()
const reviewStore = useReviewStore()

const loading = ref(false)
const detailVisible = ref(false)
const detailReg = ref<any>(null)
const scores = ref<Record<string, { averageScore: number; awardName?: string }>>({})
const detailAverageScore = ref<number | string>('-')

onMounted(async () => {
  if (!auth.currentUser) return
  loading.value = true
  try {
    await Promise.all([
      regStore.fetchByStudent(auth.currentUser.userId),
      compStore.fetchAll(),
    ])

    // 加载每个报名的平均分和奖项
    const myRegs = regStore.getByStudent(auth.currentUser.userId)
    // 并行加载所有竞赛的奖项数据
    const compIds = [...new Set(myRegs.map(r => r.competitionId))]
    await Promise.all(compIds.map(id => reviewStore.fetchAwards(id).catch(() => {})))

    const scorePromises = myRegs.map(async (reg) => {
      try {
        const result = await reviewApi.getAverageScore(reg.registrationId)
        scores.value[reg.registrationId] = {
          averageScore: result.averageScore ?? 0,
          awardName: reviewStore.awards.find(a => a.registrationId === reg.registrationId)?.name,
        }
      } catch {
        scores.value[reg.registrationId] = { averageScore: 0 }
      }
    })
    await Promise.all(scorePromises)
  } finally {
    loading.value = false
  }

  // 如果URL带regId，自动打开详情
  const regId = route.query.regId as string
  if (regId) {
    const reg = regStore.getById(regId)
    if (reg) showDetail(reg)
  }
})

const list = computed(() => {
  if (!auth.currentUser) return []
  return regStore.getByStudent(auth.currentUser.userId)
})

const reviewList = ref<any[]>([])

function getCompTitle(id: string) { return compStore.getById(id)?.title || '未知竞赛' }
function getUserName(id: string) { return auth.users.find(u => u.userId === id)?.name || id }

async function showDetail(reg: any) {
  detailReg.value = reg
  detailVisible.value = true
  reviewList.value = []
  detailAverageScore.value = '-'
  try {
    const reviews = await reviewApi.getScores(reg.registrationId)
    reviewList.value = reviews.map(r => ({ ...r, details: undefined }))
    const avg = await reviewApi.getAverageScore(reg.registrationId)
    detailAverageScore.value = avg.averageScore ?? '-'
  } catch {
    // ignore
  }
}
</script>
