<template>
  <div>
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>
        <span style="font-size: 1.1em;">{{ isEdit ? '编辑竞赛' : '创建竞赛' }}</span>
      </template>
    </el-page-header>

    <el-card>
      <el-steps :active="step" align-center style="margin-bottom: 32px;">
        <el-step title="基本信息" />
        <el-step title="时间设置" />
        <el-step title="参赛规则" />
      </el-steps>

      <el-form :model="form" label-width="140px" style="max-width: 800px;" ref="formRef">
        <!-- 步骤1: 基本信息 -->
        <template v-if="step === 0">
          <el-form-item label="竞赛名称" required>
            <el-input v-model="form.title" placeholder="请输入竞赛名称" />
          </el-form-item>
          <el-form-item label="主办单位" required>
            <el-input v-model="form.organizer" placeholder="如：计算机学院" />
          </el-form-item>
          <el-form-item label="学科分类" required>
            <el-select v-model="form.category" style="width: 100%;">
              <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </el-form-item>
          <el-form-item label="竞赛简介" required>
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简短介绍（显示在竞赛卡片上）" />
          </el-form-item>
          <el-form-item label="详细说明">
            <el-input v-model="form.detail" type="textarea" :rows="6" placeholder="详细说明（支持HTML格式）" />
          </el-form-item>
        </template>

        <!-- 步骤2: 时间设置 -->
        <template v-if="step === 1">
          <el-form-item label="报名开始时间" required>
            <el-date-picker v-model="form.regStart" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="报名截止时间" required>
            <el-date-picker v-model="form.regEnd" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="作品上传开始" required>
            <el-date-picker v-model="form.submitStart" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="作品上传截止" required>
            <el-date-picker v-model="form.submitEnd" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="评审开始时间" required>
            <el-date-picker v-model="form.reviewStart" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="评审截止时间" required>
            <el-date-picker v-model="form.reviewEnd" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="决赛时间">
            <el-date-picker v-model="form.finalTime" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="决赛地点">
            <el-input v-model="form.finalLocation" placeholder="如：田家炳教学楼 301 会议室" />
          </el-form-item>
          <el-form-item label="结果公布时间" required>
            <el-date-picker v-model="form.resultTime" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
          </el-form-item>
        </template>

        <!-- 步骤3: 参赛规则 -->
        <template v-if="step === 2">
          <el-form-item label="允许文件格式" required>
            <el-checkbox-group v-model="form.allowFormatList">
              <el-checkbox v-for="fmt in formatOptions" :key="fmt" :label="fmt" :value="fmt" />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="单文件最大大小">
            <el-input-number v-model="form.maxFileSize" :min="1" :max="500" /> MB
          </el-form-item>
          <el-form-item label="参赛形式">
            <el-radio-group v-model="form.allowIndividual">
              <el-radio :value="false">仅限团队参赛</el-radio>
              <el-radio :value="true">允许个人参赛</el-radio>
            </el-radio-group>
          </el-form-item>
          <template v-if="!form.allowIndividual">
            <el-form-item label="团队最小人数">
              <el-input-number v-model="form.teamMin" :min="2" :max="10" />
            </el-form-item>
            <el-form-item label="团队最大人数">
              <el-input-number v-model="form.teamMax" :min="2" :max="10" />
            </el-form-item>
          </template>
          <el-form-item label="需要指导老师">
            <el-switch v-model="form.requireAdvisor" />
          </el-form-item>
          <el-form-item label="评审模式">
            <el-radio-group v-model="form.reviewMode">
              <el-radio value="open">公开评审（评委可见参赛者信息）</el-radio>
              <el-radio value="blind">盲评（评委不可见参赛者信息）</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
      </el-form>

      <div style="display: flex; justify-content: center; gap: 16px; margin-top: 32px;">
        <el-button v-if="step > 0" @click="step--">上一步</el-button>
        <el-button v-if="step < 2" type="primary" @click="step++">下一步</el-button>
        <el-button v-if="step === 2" @click="saveDraft">保存草稿</el-button>
        <el-button v-if="step === 2" type="primary" @click="saveAndSubmit">保存并提交审核</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import type { Competition } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const compStore = useCompetitionStore()

const isEdit = computed(() => !!route.params.id)
const step = ref(0)
const categories = ['理工类', '人文社科类', '经管类', '艺术体育类', '创新创业类', '综合类']
const formatOptions = ['zip', 'rar', '7z', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp4', 'avi', 'mov', 'jpg', 'png', 'gif', 'mp3']

const defaultForm = {
  title: '',
  organizer: '',
  category: '',
  description: '',
  detail: '',
  regStart: '',
  regEnd: '',
  submitStart: '',
  submitEnd: '',
  reviewStart: '',
  reviewEnd: '',
  finalTime: '',
  finalLocation: '',
  resultTime: '',
  allowFormatList: ['zip', 'pdf', 'ppt', 'pptx', 'mp4'],
  maxFileSize: 100,
  allowIndividual: false,
  teamMin: 2,
  teamMax: 5,
  requireAdvisor: false,
  reviewMode: 'open' as 'open' | 'blind',
}

const form = reactive({ ...defaultForm })

onMounted(async () => {
  if (isEdit.value) {
    const comp = await compStore.fetchById(route.params.id as string)
    Object.assign(form, {
        title: comp.title,
        organizer: comp.organizer,
        category: comp.category,
        description: comp.description,
        detail: comp.detail || '',
        regStart: comp.regStart,
        regEnd: comp.regEnd,
        submitStart: comp.submitStart,
        submitEnd: comp.submitEnd,
        reviewStart: comp.reviewStart,
        reviewEnd: comp.reviewEnd,
        finalTime: comp.finalTime || '',
        finalLocation: comp.finalLocation || '',
        resultTime: comp.resultTime,
        allowFormatList: comp.allowFormats.split(',').map(f => f.trim()),
        maxFileSize: comp.maxFileSize,
        allowIndividual: comp.allowIndividual,
        teamMin: comp.teamMin || 2,
        teamMax: comp.teamMax || 5,
        requireAdvisor: comp.requireAdvisor,
        reviewMode: comp.reviewMode,
      })
  }
})

function buildComp(): Omit<Competition, 'competitionId' | 'createdAt' | 'updatedAt'> {
  return {
    title: form.title,
    organizer: form.organizer,
    category: form.category,
    description: form.description,
    detail: form.detail,
    coverImage: '',
    creatorId: auth.currentUser!.userId,
    status: 'draft',
    regStart: form.regStart,
    regEnd: form.regEnd,
    submitStart: form.submitStart,
    submitEnd: form.submitEnd,
    reviewStart: form.reviewStart,
    reviewEnd: form.reviewEnd,
    finalTime: form.finalTime || undefined,
    finalLocation: form.finalLocation || undefined,
    resultTime: form.resultTime,
    allowFormats: form.allowFormatList.join(','),
    maxFileSize: form.maxFileSize,
    allowIndividual: form.allowIndividual,
    teamMin: form.allowIndividual ? undefined : form.teamMin,
    teamMax: form.allowIndividual ? undefined : form.teamMax,
    requireAdvisor: form.requireAdvisor,
    reviewMode: form.reviewMode,
  }
}

async function saveDraft() {
  if (isEdit.value) {
    await compStore.update(route.params.id as string, buildComp())
  } else {
    const c = await compStore.create(buildComp())
    router.push(`/teacher/manage/${c.competitionId}`)
  }
  ElMessage.success('草稿已保存')
}

async function saveAndSubmit() {
  const comp = buildComp()
  if (isEdit.value) {
    await compStore.update(route.params.id as string, comp)
    await compStore.submitForAudit(route.params.id as string)
  } else {
    const c = await compStore.create(comp)
    await compStore.submitForAudit(c.competitionId)
  }
  ElMessage.success('已提交审核')
  router.push('/teacher/competitions')
}
</script>
