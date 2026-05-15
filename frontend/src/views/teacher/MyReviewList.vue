<template>
  <div>
    <h2 style="margin-bottom: 20px;">我的评审</h2>
    <el-table v-if="list.length" :data="list" stripe v-loading="loading">
      <el-table-column label="竞赛名称" min-width="200">
        <template #default="{ row }">{{ getCompTitle(row.competitionId) }}</template>
      </el-table-column>
      <el-table-column label="评审时间" width="200">
        <template #default="{ row }">
          <template v-if="getComp(row.competitionId)">
            {{ formatDate(getComp(row.competitionId)!.reviewStart) }} ~ {{ formatDate(getComp(row.competitionId)!.reviewEnd) }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <StatusTag :status="getComp(row.competitionId)?.status || ''" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="$router.push(`/teacher/judge/${row.competitionId}`)">
            进入评审
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else-if="!loading" description="暂无评审任务">
      <p style="color: #909399; font-size: .88em;">请联系竞赛创建者将你指派为评委</p>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompetitionStore } from '@/stores/competition'
import { reviewApi } from '@/api'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const compStore = useCompetitionStore()
const loading = ref(false)
const assignments = ref<any[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const result = await reviewApi.getMyAssignments()
    assignments.value = result
    // 加载对应竞赛信息
    const compIds = [...new Set(result.map(a => a.competitionId))]
    await Promise.all(compIds.map(() => compStore.fetchAll()))
  } catch {
    assignments.value = []
  } finally {
    loading.value = false
  }
})

const list = computed(() => assignments.value)

function getComp(id: string) { return compStore.getById(id) }
function getCompTitle(id: string) { return getComp(id)?.title || '未知竞赛' }
</script>
