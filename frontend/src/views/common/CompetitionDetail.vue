<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>
        <span style="font-size: 1.2em; font-weight: 600;">{{ comp.title }}</span>
      </template>
    </el-page-header>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>竞赛信息</span>
              <StatusTag :status="comp.status" />
            </div>
          </template>
          <div style="line-height: 2;">
            <p><strong>主办单位：</strong>{{ comp.organizer }}</p>
            <p><strong>学科分类：</strong>{{ comp.category }}</p>
            <p><strong>参赛形式：</strong>{{ comp.allowIndividual ? '个人/团队均可' : '仅限团队' }}
              <template v-if="!comp.allowIndividual && comp.teamMin">（{{ comp.teamMin }}~{{ comp.teamMax }}人/队）</template>
            </p>
            <p><strong>指导老师：</strong>{{ comp.requireAdvisor ? '必填' : '选填' }}</p>
            <p><strong>作品格式：</strong>{{ comp.allowFormats }}</p>
            <p><strong>单文件上限：</strong>{{ comp.maxFileSize }}MB</p>
            <p><strong>评审模式：</strong>{{ comp.reviewMode === 'blind' ? '盲评（评委不可见参赛者信息）' : '公开评审' }}</p>
          </div>
        </el-card>

        <el-card v-if="comp.detail" style="margin-bottom: 20px;">
          <template #header><span>详细说明</span></template>
          <div v-html="comp.detail" style="line-height: 1.8;" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <!-- 时间轴 -->
        <el-card style="margin-bottom: 20px;">
          <template #header><span>时间安排</span></template>
          <TimelineBar :items="timelineItems" />
        </el-card>

        <!-- 操作区 -->
        <el-card v-if="auth.userRole === 'student'">
          <template #header><span>参赛操作</span></template>
          <!-- 已报名学生：显示上传入口（不依赖报名窗口是否关闭） -->
          <div v-if="alreadyRegistered">
            <el-alert title="您已报名此竞赛" type="success" :closable="false" style="margin-bottom: 12px;" />
            <div style="display: flex; gap: 8px;">
              <el-button type="primary" @click="$router.push('/student/registrations')">查看我的报名</el-button>
              <el-button v-if="isSubmitWindowOpen && currentRegId" type="success" @click="$router.push(`/student/upload/${currentRegId}`)">
                上传作品
              </el-button>
            </div>
          </div>
          <!-- 未报名且报名窗口开启 -->
          <div v-else-if="isRegistrationOpen">
            <p style="margin-bottom: 12px; color: #606266;">报名截止：{{ formatDate(comp.regEnd) }}</p>
            <el-button type="primary" size="large" style="width: 100%;" @click="openRegisterDialog">
              立即报名
            </el-button>
          </div>
          <div v-else-if="comp.status === 'published' && regNotStarted">
            <el-alert title="报名尚未开始" type="info" :closable="false" style="margin-bottom: 8px;">
              <template #default>
                <p>报名时间：{{ formatDate(comp.regStart) }} ~ {{ formatDate(comp.regEnd) }}</p>
              </template>
            </el-alert>
          </div>
          <div v-else-if="comp.status === 'published' && regEnded">
            <el-alert title="报名已截止" type="warning" :closable="false" style="margin-bottom: 8px;">
              <template #default>
                <p>报名截止于 {{ formatDate(comp.regEnd) }}</p>
              </template>
            </el-alert>
          </div>
          <div v-else-if="['reviewing', 'final', 'ended'].includes(comp.status)">
            <el-alert :title="'当前状态：' + getStatusText(comp.status)" type="info" :closable="false" />
          </div>
          <div v-else>
            <el-alert title="此竞赛尚未发布" type="warning" :closable="false" />
          </div>
        </el-card>

        <el-card v-else-if="auth.userRole === 'teacher' && comp.status === 'draft'" style="margin-top: 20px;">
          <el-button type="primary" @click="$router.push(`/teacher/edit/${comp.competitionId}`)">编辑竞赛</el-button>
          <el-button type="success" style="margin-left: 8px;" @click="submitAudit">提交审核</el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 往期竞赛：显示排名结果 & 评审教师 -->
    <el-row v-if="comp.status === 'ended'" :gutter="20" style="margin-top: 20px;">
      <el-col :span="14">
        <el-card>
          <template #header><span>获奖排名</span></template>
          <el-table v-if="results.length > 0" :data="results" stripe size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="奖项" width="120">
              <template #default="{ row }">
                <el-tag :type="row.registration ? 'success' : 'info'">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="获奖者" min-width="200">
              <template #default="{ row }">
                <template v-if="row.registration">
                  <span>{{ row.registration.workTitle }}</span>
                  <span v-if="row.registration.teamName" style="color: #909399;"> — {{ row.registration.teamName }}</span>
                  <span v-else-if="row.registration.studentName" style="color: #909399;"> — {{ row.registration.studentName }}</span>
                </template>
                <span v-else style="color: #c0c4cc;">待公布</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无奖项信息" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>评审教师 ({{ reviewers.length }})</span></template>
          <div v-if="reviewers.length > 0">
            <el-tag
              v-for="r in reviewers" :key="r.teacherId"
              style="margin: 4px;"
            >
              {{ teacherMap[r.teacherId]?.name || r.teacherId }}
              <span v-if="teacherMap[r.teacherId]?.college" style="color: #909399;">({{ teacherMap[r.teacherId].college }})</span>
            </el-tag>
          </div>
          <el-empty v-else description="暂无评审教师" :image-size="40" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 报名对话框 -->
    <el-dialog v-model="showRegDialog" title="报名参赛" width="600px" @close="resetForm">
      <el-form :model="regForm" label-width="100px">
        <el-form-item label="参赛方式">
          <el-radio-group v-model="regForm.mode">
            <el-radio value="team">团队报名</el-radio>
            <el-radio value="individual" :disabled="!comp.allowIndividual">个人报名</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="regForm.mode === 'team'" label="选择团队">
          <el-select v-model="regForm.teamId" placeholder="请选择团队" style="width: 100%;">
            <el-option v-for="t in myTeams" :key="t.teamId" :label="t.name" :value="t.teamId" />
          </el-select>
          <el-button text type="primary" style="margin-top: 8px;" @click="$router.push('/student/teams')">
            创建新团队
          </el-button>
        </el-form-item>
        <el-form-item label="作品名称" required>
          <el-input v-model="regForm.workTitle" placeholder="请输入参赛作品名称/题目" />
        </el-form-item>
        <el-form-item v-if="comp.requireAdvisor" label="指导老师" required>
          <el-select v-model="regForm.advisorId" placeholder="请选择指导老师" style="width: 100%;" filterable>
            <el-option v-for="t in teachers" :key="t.userId" :label="t.name + ' (' + t.college + ')'" :value="t.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input v-model="regForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegDialog = false">取消</el-button>
        <el-button type="primary" @click="doRegister" :disabled="!canSubmit">确认报名</el-button>
      </template>
    </el-dialog>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useTeamStore } from '@/stores/team'
import type { Competition, User, ReviewerAssignment } from '@/types'
import { formatDate, getStatusText, nowLocal } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'
import TimelineBar from '@/components/common/TimelineBar.vue'
import { userApi, awardApi, reviewApi } from '@/api'

const route = useRoute()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const teamStore = useTeamStore()

const comp = ref<Competition | null>(null)
const alreadyRegistered = ref(false)
const currentRegId = ref<string | null>(null)
const loading = ref(true)
const results = ref<any[]>([])
const reviewers = ref<ReviewerAssignment[]>([])
const teacherMap = ref<Record<string, { name: string; college: string }>>({})

const timelineItems = computed(() => {
  if (!comp.value) return []
  const c = comp.value
  const now = nowLocal()
  return [
    { title: '报名开始', time: c.regStart, active: now >= c.regStart },
    { title: '报名截止', time: c.regEnd, active: now >= c.regEnd },
    { title: '作品上传截止', time: c.submitEnd, active: now >= c.submitEnd },
    { title: '评审时间', time: c.reviewStart, active: now >= c.reviewStart },
    { title: '决赛', time: c.finalTime || '', active: now >= (c.finalTime || ''), },
    { title: '结果公布', time: c.resultTime, active: now >= c.resultTime },
  ].filter(i => i.time)
})

const myTeams = computed(() => {
  if (!auth.currentUser) return []
  return teamStore.getByStudent(auth.currentUser.userId)
})

const teachers = ref<User[]>([])

async function loadTeachers() {
  try {
    teachers.value = await userApi.getTeachers()
  } catch {
    teachers.value = []
  }
}

const isRegistrationOpen = computed(() => {
  if (!comp.value) return false
  const now = nowLocal()
  return ['published', 'registering'].includes(comp.value.status) && now >= comp.value.regStart && now <= comp.value.regEnd
})

const regNotStarted = computed(() => {
  if (!comp.value) return false
  return nowLocal() < comp.value.regStart
})

const regEnded = computed(() => {
  if (!comp.value) return false
  return nowLocal() > comp.value.regEnd
})

const isSubmitWindowOpen = computed(() => {
  if (!comp.value) return false
  const now = nowLocal()
  return now >= comp.value.submitStart && now <= comp.value.submitEnd
})

onMounted(async () => {
  const id = route.params.id as string
  try {
    const competition = await compStore.fetchById(id)
    if (competition) {
      comp.value = competition
      if (!compStore.competitions.find(c => c.competitionId === id)) {
        compStore.competitions.push(competition)
      }
    }
  } catch {
    // comp remains null
  }

  if (auth.userRole === 'student') {
    await Promise.all([
      teamStore.fetchMine(),
      regStore.checkRegistered(id).then(r => { alreadyRegistered.value = r.registered; currentRegId.value = r.registrationId || null }),
    ])
  }

  if (auth.userRole === 'student' && comp.value?.requireAdvisor) {
    await loadTeachers()
  }

  // 往期竞赛：加载获奖结果和评审教师
  if (comp.value?.status === 'ended') {
    try {
      const [resData, revData, teacherData] = await Promise.all([
        awardApi.getResults(id),
        reviewApi.getReviewers(id),
        userApi.getTeachers(),
      ])
      results.value = resData
      reviewers.value = revData
      for (const t of teacherData) {
        teacherMap.value[t.userId] = { name: t.name, college: t.college }
      }
    } catch { /* ignore */ }
  }

  loading.value = false
})

// 报名表单
const showRegDialog = ref(false)
const regForm = ref({
  mode: 'team' as 'team' | 'individual',
  teamId: '',
  workTitle: '',
  advisorId: '',
  notes: '',
})

const canSubmit = computed(() => {
  if (!comp.value) return false
  if (!regForm.value.workTitle.trim()) return false
  if (comp.value.requireAdvisor && !regForm.value.advisorId) return false
  if (regForm.value.mode === 'team' && !regForm.value.teamId) return false
  return true
})

function resetForm() {
  regForm.value = { mode: comp.value?.allowIndividual ? 'individual' : 'team', teamId: '', workTitle: '', advisorId: '', notes: '' }
}

function openRegisterDialog() {
  resetForm()
  showRegDialog.value = true
}

async function doRegister() {
  if (!auth.currentUser || !comp.value) return
  // 团队人数校验
  if (regForm.value.mode === 'team' && regForm.value.teamId) {
    const memberCount = teamStore.getAcceptedMembers(regForm.value.teamId).length
    if (comp.value.teamMin && memberCount < comp.value.teamMin) {
      ElMessage.error(`团队人数不足，至少需要 ${comp.value.teamMin} 人`)
      return
    }
    if (comp.value.teamMax && memberCount > comp.value.teamMax) {
      ElMessage.error(`团队人数超出限制，最多 ${comp.value.teamMax} 人`)
      return
    }
  }
  const data: any = {
    competitionId: comp.value.competitionId,
    workTitle: regForm.value.workTitle,
    advisorId: regForm.value.advisorId || undefined,
    notes: regForm.value.notes || undefined,
  }
  if (regForm.value.mode === 'team') {
    data.teamId = regForm.value.teamId
  } else {
    data.studentId = auth.currentUser.userId
  }
  try {
    const reg = await regStore.register(data)
    alreadyRegistered.value = true
    currentRegId.value = reg.registrationId
    ElMessage.success('报名成功！')
    showRegDialog.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '报名失败')
  }
}

function submitAudit() {
  ElMessageBox.confirm('确认提交审核？提交后将不可修改。', '提交审核', { type: 'warning' })
    .then(async () => {
      if (comp.value) {
        await compStore.submitForAudit(comp.value.competitionId)
        ElMessage.success('已提交审核')
      }
    })
}
</script>
