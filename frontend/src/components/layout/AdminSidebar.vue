<template>
  <el-menu :default-active="route.path" background-color="#1a3c4a" text-color="#b0c4d8" active-text-color="#fff" router>
    <el-menu-item index="/admin/dashboard">
      <el-icon><DataAnalysis /></el-icon>
      <span>工作台</span>
    </el-menu-item>
    <el-menu-item index="/admin/settings">
      <el-icon><Setting /></el-icon>
      <span>系统设置</span>
    </el-menu-item>
    <el-menu-item index="/admin/audit">
      <el-icon><Checked /></el-icon>
      <span>竞赛审核</span>
      <el-badge :value="compStore.pendingCount" :hidden="compStore.pendingCount === 0" style="margin-left: auto;" />
    </el-menu-item>
    <el-menu-item index="/admin/competitions">
      <el-icon><TrophyBase /></el-icon>
      <span>竞赛管理</span>
    </el-menu-item>
    <el-menu-item index="/admin/users">
      <el-icon><User /></el-icon>
      <span>用户管理</span>
    </el-menu-item>
    <el-menu-item index="/admin/invite-codes">
      <el-icon><Ticket /></el-icon>
      <span>邀请码管理</span>
    </el-menu-item>
    <el-menu-item index="/admin/feedback">
      <el-icon><ChatLineSquare /></el-icon>
      <span>反馈管理</span>
    </el-menu-item>
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>竞赛广场</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DataAnalysis, Checked, TrophyBase, User, HomeFilled, ChatLineSquare, Ticket, Setting } from '@element-plus/icons-vue'
import { useCompetitionStore } from '@/stores/competition'

const route = useRoute()
const compStore = useCompetitionStore()
</script>
