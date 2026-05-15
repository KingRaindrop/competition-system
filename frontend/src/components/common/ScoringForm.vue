<template>
  <div>
    <h4 style="margin-bottom: 16px;">评审打分</h4>
    <el-form label-width="120px">
      <el-form-item v-for="rubric in rubrics" :key="rubric.rubricId" :label="rubric.name">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <el-slider
            :model-value="scores[rubric.rubricId] || 0"
            :max="rubric.maxScore"
            :step="0.5"
            show-input
            style="flex: 1"
            @update:model-value="(v: number) => setScore(rubric.rubricId, v)"
          />
          <span style="font-size: .85em; color: #909399; white-space: nowrap;">
            满分 {{ rubric.maxScore }} · 权重 {{ (rubric.weight * 100).toFixed(0) }}%
          </span>
        </div>
      </el-form-item>
      <el-form-item label="综合评语">
        <el-input
          :model-value="comment"
          type="textarea"
          :rows="4"
          placeholder="请输入评语（选填）"
          @update:model-value="(v: string) => emit('update:comment', v)"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('submit')">提交评分</el-button>
        <el-button @click="emit('save')">暂存草稿</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { ScoringRubric } from '@/types'

const props = defineProps<{
  rubrics: ScoringRubric[]
  scores: Record<string, number>
  comment: string
}>()

const emit = defineEmits<{
  'update:comment': [v: string]
  'update:scores': [s: Record<string, number>]
  submit: []
  save: []
}>()

function setScore(rubricId: string, value: number) {
  const updated = { ...props.scores, [rubricId]: value }
  emit('update:scores', updated)
}
</script>
