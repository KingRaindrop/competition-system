<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="font-size: 1.3em;">竞赛广场</h2>
      <el-button v-if="auth.userRole === 'teacher'" type="primary" @click="$router.push('/teacher/create')">
        <el-icon><Plus /></el-icon> 创建竞赛
      </el-button>
    </div>

    <el-empty v-if="compStore.getPublished().length === 0" description="暂无竞赛" />
    <el-row v-else :gutter="16">
      <el-col v-for="comp in compStore.getPublished()" :key="comp.competitionId" :span="8" style="margin-bottom: 16px;">
        <CompetitionCard :comp="comp" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import CompetitionCard from '@/components/common/CompetitionCard.vue'

const auth = useAuthStore()
const compStore = useCompetitionStore()

onMounted(async () => {
  await compStore.fetchPublished()
  compStore.refreshStatuses()
})
</script>
