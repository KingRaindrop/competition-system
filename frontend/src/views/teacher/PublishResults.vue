<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>结果公布 — {{ comp.title }}</template>
    </el-page-header>

    <!-- 奖项设置 -->
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>奖项设置</span>
          <el-button @click="addAward">添加奖项</el-button>
        </div>
      </template>
      <el-table :data="awardItems" stripe>
        <el-table-column label="奖项名称" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.name" placeholder="如：一等奖" />
          </template>
        </el-table-column>
        <el-table-column label="名额" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.quota" :min="1" />
          </template>
        </el-table-column>
        <el-table-column label="获奖作品" min-width="200">
          <template #default="{ row }">
            <el-select v-model="row.registrationId" placeholder="选择获奖作品" clearable filterable style="width: 100%;">
              <el-option
                v-for="r in availableRegs"
                :key="r.registrationId"
                :label="r.workTitle"
                :value="r.registrationId"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" text @click="awardItems.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 排名参考 -->
    <el-card style="margin-bottom: 20px;">
      <template #header><span>排名参考</span></template>
      <el-table :data="rankedList" stripe size="small">
        <el-table-column label="排名" type="index" width="60" />
        <el-table-column prop="workTitle" label="作品名称" min-width="150" />
        <el-table-column label="平均分" width="100">
          <template #default="{ row }">{{ reviewStore.getAverageScore(row.registrationId).toFixed(1) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <div style="text-align: center;">
      <el-button type="success" size="large" @click="publishResults">公布结果</el-button>
      <p style="margin-top: 8px; color: #909399; font-size: .85em;">
        公布后所有用户可见，请确认奖项和获奖名单无误
      </p>
    </div>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useReviewStore } from '@/stores/review'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const reviewStore = useReviewStore()
const notifStore = useNotificationStore()

const comp = computed(() => compStore.getById(route.params.id as string))

interface AwardItem { name: string; quota: number; registrationId: string }

const awardItems = ref<AwardItem[]>([
  { name: '一等奖', quota: 1, registrationId: '' },
  { name: '二等奖', quota: 2, registrationId: '' },
  { name: '三等奖', quota: 3, registrationId: '' },
])

const availableRegs = computed(() => {
  if (!comp.value) return []
  return regStore.getByCompetition(comp.value.competitionId)
})

watch(availableRegs, regs => {
  regs.forEach(r => reviewStore.fetchAverageScore(r.registrationId))
}, { immediate: true })

const rankedList = computed(() => {
  return [...availableRegs.value].sort((a, b) =>
    reviewStore.getAverageScore(b.registrationId) - reviewStore.getAverageScore(a.registrationId)
  )
})

function addAward() {
  awardItems.value.push({ name: '', quota: 1, registrationId: '' })
}

async function publishResults() {
  try {
    await ElMessageBox.confirm('确认公布结果？公布后所有用户可见，请确保奖项和名单无误。', '公布结果', {
      type: 'warning',
      confirmButtonText: '确认公布',
    })
  } catch {
    return // 用户取消
  }
  if (!comp.value) return
  await reviewStore.saveAwards(comp.value.competitionId, awardItems.value.map(a => ({
    name: a.name,
    quota: a.quota,
    registrationId: a.registrationId || undefined,
  })))
  await compStore.endCompetition(comp.value.competitionId)
  // 通知所有报名者
  availableRegs.value.forEach(r => {
    const studentId = r.studentId || 'S2024001'
    notifStore.send(studentId, '竞赛结果公布', `"${comp.value!.title}"结果已公布，请查看您的成绩和获奖情况。`)
  })
  ElMessage.success('结果已公布！')
  router.push('/teacher/competitions')
}
</script>
