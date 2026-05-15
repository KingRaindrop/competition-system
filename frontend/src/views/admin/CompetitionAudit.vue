<template>
  <div>
    <h2 style="margin-bottom: 20px;">竞赛审核</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待审核" name="pending">
        <el-table :data="pendingList" stripe>
          <el-table-column prop="title" label="竞赛名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="organizer" label="主办单位" width="120" />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column label="创建者" width="100">
            <template #default="{ row }">{{ getUserName(row.creatorId) }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="150">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/competition/${row.competitionId}`)">查看详情</el-button>
              <el-button size="small" type="success" @click="approve(row)">通过</el-button>
              <el-button size="small" type="danger" @click="reject(row)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="pendingList.length === 0" description="暂无待审核竞赛" />
      </el-tab-pane>

      <el-tab-pane label="已通过" name="approved">
        <el-table :data="approvedList" stripe>
          <el-table-column prop="title" label="竞赛名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="organizer" label="主办单位" width="120" />
          <el-table-column label="当前状态" width="100">
            <template #default="{ row }"><StatusTag :status="row.status" /></template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/competition/${row.competitionId}`)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已驳回" name="rejected">
        <el-table :data="rejectedList" stripe>
          <el-table-column prop="title" label="竞赛名称" min-width="180" show-overflow-tooltip />
          <el-table-column label="驳回理由" min-width="200">
            <template #default="{ row }">{{ row.auditComment || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/competition/${row.competitionId}`)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const auth = useAuthStore()
const compStore = useCompetitionStore()
const activeTab = ref('pending')

onMounted(async () => {
  await compStore.fetchAll()
  await auth.fetchAllUsers()
})

const allList = computed(() => compStore.all())

const pendingList = computed(() => allList.value.filter(c => c.status === 'pending'))
const approvedList = computed(() =>
  allList.value.filter(c => !['draft', 'pending', 'ended', 'cancelled'].includes(c.status))
)
const rejectedList = computed(() =>
  allList.value.filter(c => c.status === 'draft' && c.auditComment)
)

function getUserName(id: string) { return auth.users.find(u => u.userId === id)?.name || id }

async function approve(comp: any) {
  try {
    await compStore.approve(comp.competitionId)
    ElMessage.success('已通过审核，竞赛已发布')
  } catch (e: any) {
    ElMessage.error(e.message || '审核通过失败')
  }
}

async function reject(comp: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回理由', '驳回竞赛', { type: 'warning', inputType: 'textarea' })
    await compStore.reject(comp.competitionId, value || '信息不完善')
    ElMessage.success('已驳回')
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}
</script>
