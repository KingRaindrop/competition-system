<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>评委评分 — {{ comp.title }}</template>
    </el-page-header>

    <el-row :gutter="20">
      <!-- 待评作品列表 -->
      <el-col :span="8">
        <el-card>
          <template #header><span>待评作品 ({{ regList.length }})</span></template>
          <div
            v-for="reg in regList"
            :key="reg.registrationId"
            :style="{
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: currentReg?.registrationId === reg.registrationId ? '2px solid #1a5276' : '1px solid #e4e7ed',
              background: currentReg?.registrationId === reg.registrationId ? '#eaf2f8' : '#fff',
            }"
            @click="selectReg(reg)"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>{{ reg.workTitle }}</strong>
              <StatusTag :status="getMyReviewStatus(reg.registrationId)" />
            </div>
            <p style="font-size: .82em; color: #909399; margin-top: 4px;">
              {{ comp.reviewMode === 'blind' ? '***（盲评模式）' : getRegOwner(reg) }}
            </p>
          </div>
          <el-empty v-if="regList.length === 0" description="无待评作品" :image-size="60" />
        </el-card>
      </el-col>

      <!-- 评分区 -->
      <el-col :span="16">
        <template v-if="currentReg">
          <el-card style="margin-bottom: 16px;">
            <template #header>
              <span>作品信息：{{ currentReg.workTitle }}</span>
            </template>
            <p v-if="comp.reviewMode !== 'blind'">{{ getRegOwner(currentReg) }}</p>
            <div style="margin-top: 8px;">
              <span v-for="f in getWorkFiles(currentReg.registrationId)" :key="f.fileId" style="margin-right: 8px;">
                <el-tag
                  type="success"
                  style="cursor: pointer;"
                  @click="openFile(f.fileId)"
                >
                  {{ f.fileName }}
                </el-tag>
              </span>
              <span v-if="getWorkFiles(currentReg.registrationId).length === 0" style="color: #909399;">无提交文件</span>
            </div>
          </el-card>

          <el-card>
            <template v-if="rubrics.length > 0">
              <el-form label-width="140px">
                <el-form-item v-for="rubric in rubrics" :key="rubric.rubricId" :label="rubric.name">
                  <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                    <el-slider
                      v-model="currentScores[rubric.rubricId]"
                      :max="rubric.maxScore"
                      :step="0.5"
                      show-input
                      style="flex: 1"
                    />
                    <span style="font-size: .82em; color: #909399; white-space: nowrap;">
                      满分 {{ rubric.maxScore }} · 权重 {{ (rubric.weight * 100).toFixed(0) }}%
                    </span>
                  </div>
                </el-form-item>
                <el-form-item label="综合评语">
                  <el-input
                    v-model="currentComment"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入评语（选填）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="saving" @click="submitReview">提交评分</el-button>
                  <el-button :loading="saving" @click="saveDraft">暂存草稿</el-button>
                </el-form-item>
              </el-form>
            </template>
            <el-empty v-else description="尚未设置评分标准，请联系建赛教师" :image-size="80" />
          </el-card>
        </template>
        <el-empty v-else description="请从左侧选择一个作品进行评分" :image-size="80" />
      </el-col>
    </el-row>
  </div>
  <el-empty v-else v-loading="pageLoading" description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useReviewStore } from '@/stores/review'
import { reviewApi, fileApi } from '@/api'
import StatusTag from '@/components/common/StatusTag.vue'
import type { WorkFile } from '@/types'

const route = useRoute()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const reviewStore = useReviewStore()

const pageLoading = ref(true)
const saving = ref(false)
const currentReg = ref<any>(null)
const currentScores = reactive<Record<string, number>>({})
const currentComment = ref('')
const workFilesMap = ref<Record<string, WorkFile[]>>({})

const comp = computed(() => compStore.getById(route.params.id as string))
const rubrics = computed(() => comp.value ? reviewStore.getRubrics(comp.value.competitionId) : [])

const regList = computed(() => {
  if (!comp.value) return []
  return regStore.getByCompetition(comp.value.competitionId).filter(r => r.status === 'submitted')
})

onMounted(async () => {
  const id = route.params.id as string
  pageLoading.value = true
  try {
    // 加载竞赛信息
    const compData = await compStore.fetchById(id)
    if (!compData) return
    if (!compStore.getById(id)) compStore.competitions.push(compData)

    await Promise.all([
      regStore.fetchByCompetition(id),
      reviewStore.fetchRubrics(id),
    ])

    // 加载已有评分（找出当前评委已有的评分记录）
    for (const reg of regList.value) {
      reviewStore.fetchScores(reg.registrationId).catch(() => {})
    }
  } finally {
    pageLoading.value = false
  }
})

async function selectReg(reg: any) {
  currentReg.value = reg
  // 加载作品文件
  try {
    const files = await fileApi.getFiles(reg.registrationId)
    workFilesMap.value[reg.registrationId] = files
  } catch {
    workFilesMap.value[reg.registrationId] = []
  }

  // 加载已有评分
  if (!auth.currentUser) return
  rubrics.value.forEach(r => { currentScores[r.rubricId] = 0 })
  currentComment.value = ''

  try {
    const review = await reviewApi.getMyScore(reg.registrationId)
    if (review) {
      currentComment.value = review.comment || ''
      if (review.details) {
        review.details.forEach(d => {
          currentScores[d.rubricId] = d.score
        })
      }
    }
  } catch { /* no existing review */ }
}

function getMyReviewStatus(regId: string): string {
  // API already loaded the review, check local store
  const reviews = reviewStore.reviews.filter(r => r.registrationId === regId)
  const myReview = reviews.find(r => r.reviewerId === auth.currentUser?.userId)
  return myReview?.status || 'draft'
}

function getRegOwner(reg: any): string {
  if (reg.studentId) return reg.studentId
  if (reg.teamId) return '团队：' + reg.teamId
  return '未知'
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

function getWorkFiles(regId: string) {
  return workFilesMap.value[regId] || []
}

async function submitReview() {
  await doSave(true)
}

async function saveDraft() {
  await doSave(false)
}

async function doSave(submit: boolean) {
  if (!auth.currentUser || !currentReg.value) return
  saving.value = true
  try {
    const scores = rubrics.value.map(r => ({
      rubricId: r.rubricId,
      score: currentScores[r.rubricId] || 0,
    }))
    await reviewApi.saveScore({
      registrationId: currentReg.value.registrationId,
      scores,
      comment: currentComment.value,
      submit,
    })
    ElMessage.success(submit ? '评分已提交' : '草稿已保存')
    // 刷新当前评分状态
    await reviewStore.fetchScores(currentReg.value.registrationId)
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
