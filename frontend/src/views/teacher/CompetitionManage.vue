<template>
  <div v-if="comp">
    <el-page-header @back="$router.back()" style="margin-bottom: 20px;">
      <template #content>
        <span style="font-size: 1.1em;">竞赛管理 — {{ comp.title }}</span>
      </template>
    </el-page-header>

    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <p style="font-size: .85em; color: #909399;">{{ stat.label }}</p>
            <p style="font-size: 1.8em; font-weight: 700; color: #1a5276;">{{ stat.value }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="报名管理" name="reg">
          <el-table :data="regList" stripe>
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column prop="workTitle" label="作品名称" min-width="150" />
            <el-table-column label="参赛形式" width="100">
              <template #default="{ row }">{{ row.teamId ? '团队' : '个人' }}</template>
            </el-table-column>
            <el-table-column label="团队/学生" min-width="150">
              <template #default="{ row }">
                <template v-if="row.teamId">{{ getTeamName(row.teamId) }}</template>
                <template v-else>{{ getUserName(row.studentId) }}</template>
              </template>
            </el-table-column>
            <el-table-column label="指导老师" width="100">
              <template #default="{ row }">{{ getUserName(row.advisorId) || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><StatusTag :status="row.status" /></template>
            </el-table-column>
            <el-table-column label="报名时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-button style="margin-top: 12px;" :icon="Download" @click="exportRegs">导出报名汇总 (CSV)</el-button>
        </el-tab-pane>

        <el-tab-pane label="作品管理" name="works">
          <el-table :data="submittedRegs" stripe>
            <el-table-column type="index" width="60" />
            <el-table-column prop="workTitle" label="作品名称" min-width="150" />
            <el-table-column label="文件数量" width="100">
              <template #default="{ row }">{{ getFileCount(row.registrationId) }}</template>
            </el-table-column>
            <el-table-column label="文件列表" min-width="200">
              <template #default="{ row }">
                <span v-for="f in getWorkFiles(row.registrationId)" :key="f.fileId" style="margin-right: 8px;">
                  <el-tag size="small" type="success" style="cursor: pointer;" @click="openFile(f.fileId)">{{ f.fileName }}</el-tag>
                </span>
                <span v-if="getFileCount(row.registrationId) === 0" style="color: #909399;">未提交</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="评审进度" name="progress">
          <el-table :data="progressList" stripe>
            <el-table-column label="评委" min-width="120">
              <template #default="{ row }">{{ getUserName(row.teacherId) }}</template>
            </el-table-column>
            <el-table-column label="已完成" width="100">
              <template #default="{ row }">{{ row.done }} / {{ row.total }}</template>
            </el-table-column>
            <el-table-column label="进度" min-width="200">
              <template #default="{ row }">
                <el-progress :percentage="row.total ? Math.round(row.done / row.total * 100) : 0" />
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 16px;">
            <el-button type="primary" @click="$router.push(`/teacher/reviewer/${comp?.competitionId}`)">管理评委</el-button>
            <el-button @click="$router.push(`/teacher/rubric/${comp?.competitionId}`)">评分标准设置</el-button>
            <el-button type="success" @click="$router.push(`/teacher/scores/${comp?.competitionId}`)">查看评分汇总</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="结果管理" name="results">
          <div style="display: flex; gap: 12px;">
            <el-button type="primary" @click="$router.push(`/teacher/scores/${comp?.competitionId}`)">查看排名</el-button>
            <el-button type="warning" @click="$router.push(`/teacher/finalists/${comp?.competitionId}`)">决赛名单管理</el-button>
            <el-button type="success" @click="$router.push(`/teacher/publish/${comp?.competitionId}`)">结果公布</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="团队管理" name="teams">
          <el-table v-if="teamsList.length" :data="teamsList" stripe row-key="teamId">
            <el-table-column type="expand">
              <template #default="{ row: team }">
                <el-table v-if="team.members?.length" :data="team.members" size="small" style="margin: 8px 0;">
                  <el-table-column label="姓名" width="120">
                    <template #default="{ row: m }">{{ m.user?.name || m.studentId }}</template>
                  </el-table-column>
                  <el-table-column label="学号" width="130">
                    <template #default="{ row: m }">{{ m.studentId }}</template>
                  </el-table-column>
                  <el-table-column label="角色" width="80">
                    <template #default="{ row: m }">
                      <el-tag size="small" :type="m.role === 'captain' ? 'warning' : 'info'">
                        {{ m.role === 'captain' ? '队长' : '队员' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="80">
                    <template #default="{ row: m }">
                      <el-tag size="small" :type="m.status === 'accepted' ? 'success' : 'warning'">
                        {{ m.status === 'accepted' ? '已加入' : '待接受' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ row: m }">
                      <el-popconfirm
                        v-if="m.role !== 'captain'"
                        title="确认从团队中移出该队员？"
                        @confirm="removeTeamMember(team.teamId, m.id)"
                      >
                        <template #reference>
                          <el-button size="small" type="danger" text>移出</el-button>
                        </template>
                      </el-popconfirm>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无成员" :image-size="40" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="团队名称" min-width="160" />
            <el-table-column label="队长" width="120">
              <template #default="{ row }">{{ getUserName(row.captainId) }}</template>
            </el-table-column>
            <el-table-column label="成员数" width="80">
              <template #default="{ row }">
                {{ (row.members || []).filter((m: any) => m.status === 'accepted').length }}
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-popconfirm title="确认解散该团队？此操作不可撤销。" @confirm="disbandTeam(row.teamId)">
                  <template #reference>
                    <el-button size="small" type="danger">解散</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无团队报名" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
  <el-empty v-else description="竞赛不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { fileApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import { useRegistrationStore } from '@/stores/registration'
import { useTeamStore } from '@/stores/team'
import { useReviewStore } from '@/stores/review'
import type { Competition, Team } from '@/types'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const regStore = useRegistrationStore()
const teamStore = useTeamStore()
const reviewStore = useReviewStore()

const activeTab = ref('reg')
const comp = ref<Competition | null>(null)
const teamsList = ref<Team[]>([])

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
  } catch { /* comp stays null */ }

  if (comp.value) {
    await Promise.all([
      regStore.fetchByCompetition(comp.value.competitionId),
      reviewStore.fetchRubrics(comp.value.competitionId),
      reviewStore.fetchReviewers(comp.value.competitionId),
      reviewStore.fetchProgress(comp.value.competitionId),
      teamStore.fetchMine(),
      auth.fetchAllUsers(),
    ])
    teamStore.fetchByCompetition(comp.value.competitionId).then(teams => {
      teamsList.value = teams
    })
  }
})

const regList = computed(() => comp.value ? regStore.getByCompetition(comp.value.competitionId) : [])
const submittedRegs = computed(() => regList.value.filter(r => r.status === 'submitted'))
const progressList = computed(() => comp.value ? reviewStore.getReviewerProgress(comp.value.competitionId) : [])

const stats = computed(() => {
  if (!comp.value) return []
  const regs = regList.value
  return [
    { label: '报名总数', value: regs.length },
    { label: '已提交作品', value: regs.filter(r => r.status === 'submitted').length },
    { label: '评委人数', value: reviewStore.getReviewers(comp.value.competitionId).length },
    { label: '评分维度', value: reviewStore.getRubrics(comp.value.competitionId).length },
  ]
})

function getUserName(id?: string) { return id ? (auth.users.find(u => u.userId === id)?.name || id) : '-' }
function getTeamName(id: string) { return teamStore.getById(id)?.name || id }
function getFileCount(regId: string) { return reviewStore.getWorkFiles(regId).length }
function getWorkFiles(regId: string) { return reviewStore.getWorkFiles(regId) }

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

async function disbandTeam(teamId: string) {
  try {
    await teamStore.removeTeam(teamId)
    teamsList.value = teamsList.value.filter(t => t.teamId !== teamId)
    ElMessage.success('团队已解散')
  } catch (e: any) {
    ElMessage.error(e?.message || '解散失败')
  }
}

async function removeTeamMember(teamId: string, memberId: string) {
  try {
    await teamStore.removeMember(teamId, memberId)
    // 从本地 teamsList 中移除该成员
    const team = teamsList.value.find(t => t.teamId === teamId)
    if (team && team.members) {
      team.members = team.members.filter((m: any) => m.id !== memberId)
    }
    ElMessage.success('队员已移出')
  } catch (e: any) {
    ElMessage.error(e?.message || '移除失败')
  }
}

function exportRegs() {
  const headers = ['作品名称', '参赛形式', '团队/学生', '指导老师', '状态', '报名时间']
  const rows = regList.value.map(r => [
    r.workTitle,
    r.teamId ? '团队' : '个人',
    r.teamId ? getTeamName(r.teamId) : getUserName(r.studentId),
    getUserName(r.advisorId),
    r.status,
    formatDate(r.createdAt),
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${comp.value?.title || '报名汇总'}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报名汇总已导出')
}
</script>
