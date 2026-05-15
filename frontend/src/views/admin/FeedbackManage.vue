<template>
  <div>
    <h2 style="margin-bottom: 20px;">反馈管理</h2>

    <el-card>
      <div style="margin-bottom: 16px;">
        <el-radio-group v-model="filterStatus" @change="feedbackStore.fetchAll()">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="open">待处理</el-radio-button>
          <el-radio-button value="resolved">已解决</el-radio-button>
        </el-radio-group>
      </div>

      <el-table v-if="filteredList.length" :data="filteredList" stripe v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="提交者" width="160">
          <template #default="{ row }">
            {{ row.user?.name || row.userId }}
            <span v-if="row.user?.college" style="font-size: .82em; color: #909399;"> · {{ row.user.college }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容摘要" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'warning' : 'success'" size="small">
              {{ row.status === 'open' ? '待处理' : '已解决' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openReply(row)">回复</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无反馈" />
    </el-card>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复反馈" width="600px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input :model-value="replyTarget?.title" disabled />
        </el-form-item>
        <el-form-item label="内容">
          <el-input :model-value="replyTarget?.content" type="textarea" :rows="4" disabled />
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyForm.adminReply" type="textarea" :rows="4" placeholder="填写回复内容..." />
        </el-form-item>
        <el-form-item label="标记状态">
          <el-select v-model="replyForm.status" style="width: 100%;">
            <el-option label="待处理" value="open" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doReply">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFeedbackStore } from '@/stores/feedback'
import type { Feedback } from '@/types'
import { formatDate } from '@/utils/format'

const feedbackStore = useFeedbackStore()
const loading = ref(false)
const saving = ref(false)
const filterStatus = ref('')
const replyDialogVisible = ref(false)
const replyTarget = ref<Feedback | null>(null)
const replyForm = ref<{ adminReply: string; status: 'open' | 'resolved' }>({ adminReply: '', status: 'resolved' })

onMounted(async () => {
  loading.value = true
  try {
    await feedbackStore.fetchAll()
  } finally {
    loading.value = false
  }
})

const filteredList = computed(() => {
  if (!filterStatus.value) return feedbackStore.feedbacks
  return feedbackStore.feedbacks.filter(f => f.status === filterStatus.value)
})

function openReply(fb: Feedback) {
  replyTarget.value = fb
  replyForm.value = {
    adminReply: fb.adminReply || '',
    status: fb.status,
  }
  replyDialogVisible.value = true
}

async function doReply() {
  if (!replyTarget.value) return
  saving.value = true
  try {
    await feedbackStore.update(replyTarget.value.feedbackId, replyForm.value)
    ElMessage.success('回复已保存')
    replyDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
