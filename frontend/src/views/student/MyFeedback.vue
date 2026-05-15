<template>
  <div>
    <h2 style="margin-bottom: 20px;">意见反馈</h2>

    <el-card style="margin-bottom: 20px;">
      <template #header><span>提交反馈</span></template>
      <el-form :model="form" label-width="80px" @submit.prevent="submitFeedback">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请简要描述你的问题或建议" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="详细内容" required>
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请详细描述..." maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!form.title.trim() || !form.content.trim()" :loading="submitting" @click="submitFeedback">
            提交反馈
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header><span>我的反馈记录</span></template>
      <el-table v-if="feedbackList.length" :data="feedbackList" stripe>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'warning' : 'success'" size="small">
              {{ row.status === 'open' ? '待处理' : '已回复' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="管理员回复" min-width="200">
          <template #default="{ row }">
            <span v-if="row.adminReply">{{ row.adminReply }}</span>
            <span v-else style="color: #909399;">暂未回复</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无反馈记录" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFeedbackStore } from '@/stores/feedback'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

const auth = useAuthStore()
const feedbackStore = useFeedbackStore()
const submitting = ref(false)

const form = ref({ title: '', content: '' })

onMounted(async () => {
  await feedbackStore.fetchAll()
})

const feedbackList = computed(() => {
  if (!auth.currentUser) return []
  return feedbackStore.feedbacks.filter(f => f.userId === auth.currentUser!.userId)
})

async function submitFeedback() {
  if (!form.value.title.trim() || !form.value.content.trim()) return
  submitting.value = true
  try {
    await feedbackStore.create(form.value.title.trim(), form.value.content.trim())
    ElMessage.success('反馈已提交')
    form.value = { title: '', content: '' }
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>
