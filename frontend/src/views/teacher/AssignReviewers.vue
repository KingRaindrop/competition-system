<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>评委指派 — {{ comp.title }}</template>
    </el-page-header>

    <el-card>
      <template #header><span>已指派的评委 ({{ assignedTeachers.length }})</span></template>
      <el-tag
        v-for="t in assignedTeachers" :key="t.userId"
        closable
        style="margin: 4px;"
        @close="removeReviewer(t.userId)"
      >
        {{ t.name }} ({{ t.college }})
      </el-tag>
      <el-empty v-if="assignedTeachers.length === 0" description="暂未指派评委" :image-size="40" />
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header><span>可选教师</span></template>
      <el-table :data="availableTeachers" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="college" label="学院" min-width="150" />
        <el-table-column prop="major" label="专业" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
      </el-table>
      <el-button
        type="primary"
        style="margin-top: 12px;"
        :disabled="selectedTeachers.length === 0"
        :loading="saving"
        @click="doAssign"
      >
        指派选中教师 ({{ selectedTeachers.length }})
      </el-button>
    </el-card>
  </div>
  <el-empty v-else v-loading="loading" description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCompetitionStore } from '@/stores/competition'
import { useReviewStore } from '@/stores/review'
import { userApi } from '@/api'
import type { User } from '@/types'

const route = useRoute()
const compStore = useCompetitionStore()
const reviewStore = useReviewStore()

const loading = ref(true)
const saving = ref(false)
const selectedTeachers = ref<User[]>([])
const allTeachers = ref<User[]>([])
const assignedIds = ref<string[]>([])

onMounted(async () => {
  const id = route.params.id as string
  loading.value = true
  try {
    const compData = await compStore.fetchById(id)
    if (!compData) return
    if (!compStore.getById(id)) compStore.competitions.push(compData)

    // 加载已指派评委
    await reviewStore.fetchReviewers(id)
    const existingIds = reviewStore.getReviewers(id).map(a => a.teacherId)
    assignedIds.value = existingIds

    // 加载所有教师
    allTeachers.value = await userApi.getTeachers()
  } finally {
    loading.value = false
  }
})

const comp = computed(() => compStore.getById(route.params.id as string))

const assignedTeachers = computed(() =>
  allTeachers.value.filter(t => assignedIds.value.includes(t.userId))
)

const availableTeachers = computed(() =>
  allTeachers.value.filter(t => !assignedIds.value.includes(t.userId))
)

function handleSelectionChange(rows: User[]) {
  selectedTeachers.value = rows
}

async function doAssign() {
  if (!comp.value) return
  saving.value = true
  try {
    const newIds = [...assignedIds.value, ...selectedTeachers.value.map(t => t.userId)]
    await reviewStore.assignReviewers(comp.value.competitionId, newIds)
    assignedIds.value = newIds
    ElMessage.success(`已指派 ${selectedTeachers.value.length} 位评委`)
    selectedTeachers.value = []
  } catch (e: any) {
    ElMessage.error(e?.message || '指派失败')
  } finally {
    saving.value = false
  }
}

async function removeReviewer(teacherId: string) {
  if (!comp.value) return
  try {
    const newIds = assignedIds.value.filter(id => id !== teacherId)
    await reviewStore.assignReviewers(comp.value.competitionId, newIds)
    assignedIds.value = newIds
    ElMessage.success('已移除评委')
  } catch (e: any) {
    ElMessage.error(e?.message || '移除失败')
  }
}
</script>
