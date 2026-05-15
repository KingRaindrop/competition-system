<template>
  <div>
    <h2 style="margin-bottom: 20px;">系统设置</h2>

    <el-card style="max-width: 600px;">
      <template #header><span style="font-weight: 600;">基本设置</span></template>
      <el-form label-width="120px">
        <el-form-item label="学校名称">
          <el-input v-model="schoolName" placeholder="显示在左侧栏顶部" />
          <span style="font-size: .82em; color: #909399;">修改后刷新页面生效</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'

const schoolName = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const config = await userApi.getSystemConfig()
    schoolName.value = config.schoolName || ''
  } catch { /* ignore */ }
})

async function save() {
  saving.value = true
  try {
    await userApi.updateSystemConfig({ schoolName: schoolName.value })
    ElMessage.success('已保存')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
