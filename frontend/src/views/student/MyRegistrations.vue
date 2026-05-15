<template>
  <div>
    <h2 style="margin-bottom: 20px;">我的报名</h2>
    <el-table v-if="list.length" :data="list" stripe v-loading="loading">
      <el-table-column prop="workTitle" label="作品名称" min-width="180" />
      <el-table-column label="竞赛名称" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="$router.push(`/competition/${row.competitionId}`)">
            {{ getCompTitle(row.competitionId) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="参赛形式" width="100">
        <template #default="{ row }">{{ row.teamId ? '团队' : '个人' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="报名时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="canUpload(row)" size="small" type="primary" @click="$router.push(`/student/upload/${row.registrationId}`)">
            上传作品
          </el-button>
          <el-button size="small" @click="$router.push(`/student/results?regId=${row.registrationId}`)">查看结果</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="暂无报名记录">
      <el-button type="primary" @click="$router.push('/')">去竞赛广场看看</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRegistrationStore } from '@/stores/registration'
import { useCompetitionStore } from '@/stores/competition'
import { formatDate, nowLocal } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const auth = useAuthStore()
const regStore = useRegistrationStore()
const compStore = useCompetitionStore()
const loading = ref(false)

onMounted(async () => {
  if (auth.currentUser) {
    loading.value = true
    try {
      await Promise.all([
        regStore.fetchByStudent(auth.currentUser.userId),
        compStore.fetchAll(),
      ])
    } finally {
      loading.value = false
    }
  }
})

const list = computed(() => {
  if (!auth.currentUser) return []
  return regStore.getByStudent(auth.currentUser.userId)
})

function getCompTitle(id: string) {
  return compStore.getById(id)?.title || '未知竞赛'
}

function canUpload(row: any) {
  const comp = compStore.getById(row.competitionId)
  if (!comp) return false
  const now = nowLocal()
  return now >= comp.submitStart && now <= comp.submitEnd && row.status !== 'submitted'
}
</script>
