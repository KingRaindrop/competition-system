<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>我的竞赛</h2>
      <el-button type="primary" @click="$router.push('/teacher/create')">
        <el-icon><Plus /></el-icon> 创建竞赛
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="草稿" name="draft" />
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="进行中" name="active" />
      <el-tab-pane label="已结束" name="ended" />
    </el-tabs>

    <el-table :data="filteredList" stripe v-loading="loading">
      <el-table-column prop="title" label="竞赛名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="报名时间" width="200">
        <template #default="{ row }">{{ formatDate(row.regStart) }} ~ {{ formatDate(row.regEnd) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button v-if="row.status === 'draft'" size="small" @click="$router.push(`/teacher/edit/${row.competitionId}`)">编辑</el-button>
          <el-button v-if="row.status === 'draft'" size="small" type="success" @click="submitAudit(row.competitionId)">提交审核</el-button>
          <el-button size="small" type="primary" @click="$router.push(`/teacher/manage/${row.competitionId}`)">管理</el-button>
          <el-button v-if="['registering','reviewing','final'].includes(row.status)" size="small" type="warning" @click="$router.push(`/teacher/scores/${row.competitionId}`)">查看结果</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="filteredList.length === 0" description="暂无竞赛" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const auth = useAuthStore()
const compStore = useCompetitionStore()
const activeTab = ref('all')
const loading = ref(false)

onMounted(async () => {
  if (auth.currentUser) {
    loading.value = true
    try {
      await compStore.fetchByCreator(auth.currentUser.userId)
    } finally {
      loading.value = false
    }
  }
})

const myList = computed(() => {
  if (!auth.currentUser) return []
  return compStore.getByCreator(auth.currentUser.userId)
})

const filteredList = computed(() => {
  switch (activeTab.value) {
    case 'draft': return myList.value.filter(c => c.status === 'draft')
    case 'pending': return myList.value.filter(c => c.status === 'pending')
    case 'active': return myList.value.filter(c => ['published', 'registering', 'reviewing', 'final'].includes(c.status))
    case 'ended': return myList.value.filter(c => ['ended', 'cancelled'].includes(c.status))
    default: return myList.value
  }
})

async function submitAudit(id: string) {
  try {
    await ElMessageBox.confirm('确认提交审核？', '提示', { type: 'warning' })
    await compStore.submitForAudit(id)
    ElMessage.success('已提交审核')
  } catch {
    // user cancelled or error
  }
}
</script>
