<template>
  <el-card shadow="hover" class="comp-card" @click="$router.push(`/competition/${comp.competitionId}`)">
    <div class="card-body">
      <div class="card-header">
        <StatusTag :status="comp.status" />
        <span class="category">{{ comp.category }}</span>
      </div>
      <h3 class="title">{{ comp.title }}</h3>
      <p class="org">{{ comp.organizer }}</p>
      <p class="desc">{{ comp.description }}</p>
      <div class="card-footer">
        <span>报名：{{ fmtDate(comp.regStart) }} ~ {{ fmtDate(comp.regEnd) }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { formatDateShort } from '@/utils/format'
import type { Competition } from '@/types'
import StatusTag from './StatusTag.vue'

defineProps<{ comp: Competition }>()

function fmtDate(d: string) { return formatDateShort(d) }
</script>

<style scoped>
.comp-card { cursor: pointer; border-radius: 8px; }
.comp-card:hover { transform: translateY(-2px); }
.card-body { display: flex; flex-direction: column; gap: 8px; }
.card-header { display: flex; align-items: center; gap: 8px; }
.category { font-size: .82em; color: #909399; }
.title { font-size: 1.1em; color: #303133; line-height: 1.4; }
.org { font-size: .88em; color: #606266; }
.desc { font-size: .85em; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-footer { font-size: .8em; color: #c0c4cc; margin-top: auto; }
</style>
