<template>
  <el-timeline>
    <el-timeline-item
      v-for="item in items"
      :key="item.title"
      :timestamp="fmtDate(item.time)"
      :color="item.active ? '#1a5276' : '#c0c4cc'"
    >
      {{ item.title }}
    </el-timeline-item>
  </el-timeline>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/format'

interface TimelineItem {
  title: string
  time: string
  active: boolean
}

const props = defineProps<{ items: TimelineItem[] }>()

function fmtDate(d: string) { return formatDate(d) }
</script>
