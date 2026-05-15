<template>
  <div>
    <h2 style="margin-bottom: 20px;">工作台</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <p style="font-size: .88em; color: #909399;">{{ card.label }}</p>
            <p :style="{ fontSize: '2em', fontWeight: 700, color: card.color }">{{ card.value }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 待审核竞赛 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>待审核竞赛</span>
              <el-button size="small" type="primary" @click="$router.push('/admin/audit')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingList" size="small">
            <el-table-column prop="title" label="竞赛名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="organizer" label="主办单位" width="120" />
            <el-table-column label="提交时间" width="140">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="quickApprove(row.competitionId)">通过</el-button>
                <el-button size="small" type="danger" @click="quickReject(row.competitionId)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingList.length === 0" description="暂无待审核竞赛" :image-size="60" />
        </el-card>
      </el-col>

      <!-- 进行中的竞赛 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>进行中的竞赛</span>
              <el-button size="small" @click="$router.push('/admin/competitions')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="activeList" size="small">
            <el-table-column prop="title" label="竞赛名称" min-width="150" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" /></template>
            </el-table-column>
            <el-table-column label="报名数" width="80">
              <template #default="{ row }">{{ regStore.countByCompetition(row.competitionId) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="activeList.length === 0" description="暂无进行中竞赛" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const compStore = useCompetitionStore()
const regStore = useRegistrationStore()

onMounted(() => compStore.fetchAll())

const pendingList = computed(() => compStore.getByStatus('pending'))
const activeList = computed(() =>
  compStore.all().filter(c => ['registering', 'reviewing', 'final'].includes(c.status))
)

const statCards = computed(() => [
  { label: '全部竞赛', value: compStore.all().length, color: '#1a5276' },
  { label: '待审核', value: compStore.pendingCount, color: '#e6a23c' },
  { label: '进行中', value: activeList.value.length, color: '#2980b9' },
  { label: '已结束', value: compStore.getByStatus('ended').length, color: '#909399' },
])

async function quickApprove(id: string) {
  try {
    await compStore.approve(id)
    ElMessage.success('已通过审核')
  } catch (e: any) {
    ElMessage.error(e.message || '审核通过失败')
  }
}

async function quickReject(id: string) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回理由', '驳回竞赛', { type: 'warning' })
    await compStore.reject(id, value || '信息不完善')
    ElMessage.success('已驳回')
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}
</script>
