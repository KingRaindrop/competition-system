<template>
  <el-tag :type="tagType" size="small">{{ text }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusText, getStatusType } from '@/utils/format'

const props = defineProps<{ status: string }>()
const text = computed(() => getStatusText(props.status))
const tagType = computed(() => getStatusType(props.status) as 'success' | 'warning' | 'danger' | 'info' | '')
</script>
