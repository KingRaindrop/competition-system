<template>
  <el-menu :default-active="route.path" background-color="#1a3c4a" text-color="#b0c4d8" active-text-color="#fff" router>
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>竞赛广场</span>
    </el-menu-item>
    <el-menu-item index="/student/registrations">
      <el-icon><Document /></el-icon>
      <span>我的报名</span>
    </el-menu-item>
    <el-menu-item index="/student/teams">
      <el-icon><User /></el-icon>
      <span>我的团队</span>
    </el-menu-item>
    <el-menu-item index="/student/results">
      <el-icon><DataAnalysis /></el-icon>
      <span>我的成绩</span>
    </el-menu-item>
    <el-menu-item index="/student/feedback">
      <el-icon><ChatLineSquare /></el-icon>
      <span>意见反馈</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { HomeFilled, Document, User, DataAnalysis, ChatLineSquare } from '@element-plus/icons-vue'

const route = useRoute()
</script>
