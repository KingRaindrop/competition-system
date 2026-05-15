<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>评分标准设置 — {{ comp.title }}</template>
    </el-page-header>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>评分维度</span>
          <el-button type="primary" @click="addRubric">添加维度</el-button>
        </div>
      </template>

      <el-alert
        v-if="weightSum !== 1"
        :title="`权重合计为 ${weightSum.toFixed(2)}，应为 1.00`"
        type="warning"
        style="margin-bottom: 12px;"
        :closable="false"
      />

      <el-table :data="items" stripe>
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="维度名称" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.name" placeholder="如：创新性" />
          </template>
        </el-table-column>
        <el-table-column label="满分" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.maxScore" :min="1" :max="100" />
          </template>
        </el-table-column>
        <el-table-column label="权重" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.weight"
              :min="0"
              :max="1"
              :step="0.05"
              :precision="2"
            />
            <span style="margin-left: 4px;">({{ (row.weight * 100).toFixed(0) }}%)</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" text @click="removeRubric($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: center;">
        <el-button type="primary" :disabled="weightSum !== 1" @click="doSave">保存评分标准</el-button>
      </div>
    </el-card>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCompetitionStore } from '@/stores/competition'
import { useReviewStore } from '@/stores/review'

const route = useRoute()
const router = useRouter()
const compStore = useCompetitionStore()
const reviewStore = useReviewStore()

const comp = computed(() => compStore.getById(route.params.id as string))

interface RubricItem { name: string; maxScore: number; weight: number }

const items = ref<RubricItem[]>([])

// 加载已有
const existing = computed(() => comp.value ? reviewStore.getRubrics(comp.value.competitionId) : [])
if (existing.value.length > 0) {
  items.value = existing.value.map(r => ({ name: r.name, maxScore: r.maxScore, weight: r.weight }))
} else {
  items.value = [
    { name: '', maxScore: 30, weight: 0.3 },
    { name: '', maxScore: 30, weight: 0.3 },
    { name: '', maxScore: 20, weight: 0.2 },
    { name: '', maxScore: 20, weight: 0.2 },
  ]
}

const weightSum = computed(() => {
  return Math.round(items.value.reduce((s, i) => s + i.weight, 0) * 100) / 100
})

function addRubric() {
  items.value.push({ name: '', maxScore: 20, weight: 0 })
}

function removeRubric(index: number) {
  items.value.splice(index, 1)
}

function doSave() {
  if (!comp.value) return
  reviewStore.saveRubrics(comp.value.competitionId, items.value.map((item, i) => ({
    name: item.name || `维度${i + 1}`,
    maxScore: item.maxScore,
    weight: item.weight,
    sortOrder: i + 1,
  })))
  ElMessage.success('评分标准已保存')
  router.back()
}
</script>
