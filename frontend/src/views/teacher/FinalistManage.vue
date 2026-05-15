<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>决赛名单管理 — {{ comp.title }}</template>
    </el-page-header>

    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <span>决赛名额：</span>
        <el-input-number v-model="quota" :min="1" :max="registeredList.length" />
        <el-button type="primary" @click="autoSelect">自动选取前 {{ quota }} 名</el-button>
        <el-divider direction="vertical" />
        <el-button type="success" @click="saveFinalists">保存决赛名单</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="rankedList" stripe @selection-change="handleSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column label="排名" type="index" width="60" :index="(i: number) => i + 1" />
        <el-table-column prop="workTitle" label="作品名称" min-width="180" />
        <el-table-column label="参赛者" min-width="150">
          <template #default="{ row }">
            {{ row.teamId ? getTeamName(row.teamId) : getUserName(row.studentId) }}
          </template>
        </el-table-column>
        <el-table-column label="平均分" width="100">
          <template #default="{ row }">
            <strong>{{ getAvgScore(row.registrationId) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useTeamStore } from '@/stores/team'
import { useReviewStore } from '@/stores/review'
import { useNotificationStore } from '@/stores/notification'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const teamStore = useTeamStore()
const reviewStore = useReviewStore()
const notifStore = useNotificationStore()

const quota = ref(5)
const selected = ref<any[]>([])

const comp = computed(() => compStore.getById(route.params.id as string))

const registeredList = computed(() => {
  if (!comp.value) return []
  return regStore.getByCompetition(comp.value.competitionId).filter(r => r.status === 'submitted')
})

watch(registeredList, regs => {
  regs.forEach(r => reviewStore.fetchAverageScore(r.registrationId))
}, { immediate: true })

function getAvgScore(regId: string): string {
  const avg = reviewStore.getAverageScore(regId)
  return avg > 0 ? avg.toFixed(1) : '-'
}

const rankedList = computed(() => {
  return [...registeredList.value].sort((a, b) => {
    const sa = parseFloat(getAvgScore(a.registrationId))
    const sb = parseFloat(getAvgScore(b.registrationId))
    return sb - sa
  })
})

function getUserName(id?: string) { return id ? (auth.users.find(u => u.userId === id)?.name || id) : '-' }
function getTeamName(id: string) { return teamStore.getById(id)?.name || id }

function handleSelection(rows: any[]) { selected.value = rows }

function autoSelect() {
  selected.value = rankedList.value.slice(0, quota.value)
}

function saveFinalists() {
  // 将选中者标记为入围
  selected.value.forEach(r => regStore.updateStatus(r.registrationId, 'qualified'))
  // 未选中者标记为淘汰
  const selectedIds = selected.value.map((r: any) => r.registrationId)
  registeredList.value.forEach(r => {
    if (!selectedIds.includes(r.registrationId)) {
      regStore.updateStatus(r.registrationId, 'disqualified')
    }
  })
  // 通知入围团队
  selected.value.forEach((r: any) => {
    const studentId = r.studentId || teamStore.getMembers(r.teamId).find(m => m.role === 'captain')?.studentId
    if (studentId) {
      notifStore.send(studentId, '决赛通知', `恭喜！你的作品"${r.workTitle}"已入围"${comp.value!.title}"决赛。决赛时间：${comp.value!.finalTime || '待定'}，地点：${comp.value!.finalLocation || '待定'}`)
    }
  })
  compStore.startFinal(comp.value!.competitionId)
  ElMessage.success(`已确定 ${selected.value.length} 个作品进入决赛`)
  router.back()
}
</script>
