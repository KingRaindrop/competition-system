<template>
  <el-menu :default-active="route.path" background-color="#1a3c4a" text-color="#b0c4d8" active-text-color="#fff" router>
    <el-menu-item index="/teacher/competitions">
      <el-icon><TrophyBase /></el-icon>
      <span>我的竞赛</span>
    </el-menu-item>
    <el-menu-item index="/teacher/create">
      <el-icon><Plus /></el-icon>
      <span>创建竞赛</span>
    </el-menu-item>
    <el-menu-item index="/teacher/my-reviews">
      <el-icon><EditPen /></el-icon>
      <span>我的评审</span>
    </el-menu-item>
    <el-menu-item index="/teacher/invite-codes">
      <el-icon><Ticket /></el-icon>
      <span>邀请码管理</span>
    </el-menu-item>
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>竞赛广场</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { TrophyBase, Plus, EditPen, HomeFilled, Ticket } from '@element-plus/icons-vue'

const route = useRoute()
</script>
