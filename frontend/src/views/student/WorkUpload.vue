<template>
  <div v-if="reg && comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>作品上传 — {{ comp.title }}</template>
    </el-page-header>

    <el-alert
      v-if="comp && !isInSubmitWindow"
      :title="submitWindowMessage"
      type="warning"
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header><span>上传作品文件</span></template>
          <FileUploader
            :allow-formats="comp.allowFormats"
            :max-size="comp.maxFileSize"
            :existing-files="existingFiles"
            :disabled="!isInSubmitWindow"
            @upload="handleUpload"
          />
          <FileUploader
            :allow-formats="comp.allowFormats"
            :max-size="comp.maxFileSize"
            :existing-files="existingFiles"
            @upload="handleUpload"
          />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span>已上传文件</span></template>
          <el-empty v-if="files.length === 0" description="暂无文件" :image-size="60" />
          <el-table v-else :data="files" size="small">
            <el-table-column prop="fileName" label="文件名" min-width="140" show-overflow-tooltip />
            <el-table-column label="大小" width="90">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130">
              <template #default="{ row }">
                <el-button size="small" type="primary" text @click="openFile(row.fileId)">查看</el-button>
                <el-button size="small" type="danger" text @click="removeFile(row.fileId)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 16px;">
          <template #header><span>提交状态</span></template>
          <p>作品名称：<strong>{{ reg.workTitle }}</strong></p>
          <p style="margin-top: 8px;">
            <StatusTag :status="reg.status" />
            <span v-if="reg.status === 'submitted'" style="margin-left: 8px; color: #67c23a;">已提交</span>
            <span v-else style="margin-left: 8px; color: #e6a23c;">待提交</span>
          </p>
          <template v-if="isCaptain">
            <el-button
              v-if="canSubmit"
              type="success"
              style="margin-top: 12px; width: 100%;"
              @click="confirmSubmit"
            >
              确认提交作品
            </el-button>
            <p v-else-if="isInSubmitWindow && files.length === 0" style="margin-top: 12px; font-size: .82em; color: #e6a23c;">
              请先上传作品文件
            </p>
          </template>
          <p v-else style="margin-top: 12px; font-size: .82em; color: #e6a23c;">
            只有队长能确认上传
          </p>
          <p style="margin-top: 12px; font-size: .82em; color: #909399;">
            上传截止：{{ formatDate(comp.submitEnd) }}
          </p>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <el-empty v-else description="报名记录不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useReviewStore } from '@/stores/review'
import { useAuthStore } from '@/stores/auth'
import { useTeamStore } from '@/stores/team'
import { fileApi } from '@/api'
import type { Competition, Registration, WorkFile } from '@/types'
import { formatDate, formatFileSize, nowLocal } from '@/utils/format'
import FileUploader from '@/components/common/FileUploader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const reviewStore = useReviewStore()
const auth = useAuthStore()
const teamStore = useTeamStore()

const reg = ref<Registration | null>(null)
const comp = ref<Competition | null>(null)
const files = ref<WorkFile[]>([])
const captainId = ref<string | null>(null)

const isInSubmitWindow = computed(() => {
  if (!comp.value) return false
  const now = nowLocal()
  return now >= comp.value.submitStart && now <= comp.value.submitEnd
})

const submitWindowMessage = computed(() => {
  if (!comp.value) return ''
  const now = nowLocal()
  if (now < comp.value.submitStart) return `作品上传尚未开始，开始时间：${formatDate(comp.value.submitStart)}`
  if (now > comp.value.submitEnd) return '作品上传已截止'
  return ''
})

const isCaptain = computed(() => {
  if (!reg.value || !auth.currentUser) return false
  // 个人参赛：注册者本人即为"队长"
  if (reg.value.studentId) return auth.currentUser.userId === reg.value.studentId
  // 团队参赛：队长才能确认提交
  return captainId.value === auth.currentUser.userId
})

const canSubmit = computed(() => isCaptain.value && isInSubmitWindow.value && files.value.length > 0 && reg.value?.status !== 'submitted')

const existingFiles = computed(() => files.value.map(f => ({ fileName: f.fileName, fileSize: f.fileSize, fileType: f.fileType })))

onMounted(async () => {
  const regId = route.params.regId as string
  try {
    const registration = await regStore.fetchById(regId)
    reg.value = registration
    if (!regStore.registrations.find(r => r.registrationId === regId)) {
      regStore.registrations.push(registration)
    }

    const competition = await compStore.fetchById(registration.competitionId)
    if (competition) {
      comp.value = competition
      if (!compStore.competitions.find(c => c.competitionId === registration.competitionId)) {
        compStore.competitions.push(competition)
      }
    }

    await reviewStore.fetchWorkFiles(regId)
    files.value = reviewStore.getWorkFiles(regId)

    // 获取队长信息
    if (registration.teamId) {
      try {
        const team = await teamStore.fetchById(registration.teamId)
        captainId.value = team?.captainId || null
      } catch { /* ignore */ }
    }
  } catch {
    // reg and comp remain null
  }
})

async function handleUpload(newFiles: File[]) {
  if (!reg.value) return
  try {
    await reviewStore.uploadFiles(reg.value.registrationId, newFiles)
    await reviewStore.fetchWorkFiles(reg.value.registrationId)
    files.value = reviewStore.getWorkFiles(reg.value.registrationId)
    ElMessage.success('文件上传成功')
  } catch (e: any) {
    ElMessage.error(e.message || '文件上传失败')
  }
}

async function openFile(fileId: string) {
  try {
    const token = localStorage.getItem('comp_sys_token')
    const url = fileApi.getDownloadUrl(fileId)
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '下载失败' }))
      throw new Error(err.message || '下载失败')
    }
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  } catch (e: any) {
    ElMessage.error(e?.message || '打开文件失败')
  }
}

async function removeFile(fileId: string) {
  if (!reg.value) return
  try {
    await reviewStore.removeWorkFile(fileId)
    files.value = reviewStore.getWorkFiles(reg.value.registrationId)
    ElMessage.success('文件已删除')
  } catch (e: any) {
    ElMessage.error(e.message || '文件删除失败')
  }
}

async function confirmSubmit() {
  try {
    await ElMessageBox.confirm('确认提交作品？提交后将不可修改。', '确认提交', { type: 'warning' })
  } catch {
    return // user cancelled
  }
  if (!reg.value) return
  try {
    await regStore.updateStatus(reg.value.registrationId, 'submitted')
    reg.value.status = 'submitted'
    ElMessage.success('作品提交成功！')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  }
}
</script>
