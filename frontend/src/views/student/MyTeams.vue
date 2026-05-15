<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>我的团队</h2>
      <el-button type="primary" @click="showCreate = true"><el-icon><Plus /></el-icon> 创建团队</el-button>
    </div>

    <!-- 待处理邀请 -->
    <el-card v-if="pendingInvites.length > 0" style="margin-bottom: 20px;">
      <template #header><span style="color: #e6a23c;">待处理邀请 ({{ pendingInvites.length }})</span></template>
      <div v-for="inv in pendingInvites" :key="inv.id" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
        <span>你被邀请加入团队 <strong>{{ getTeamName(inv.teamId) }}</strong></span>
        <div>
          <el-button size="small" type="success" @click="respond(inv.id, 'accepted')">接受</el-button>
          <el-button size="small" type="danger" @click="respond(inv.id, 'rejected')">拒绝</el-button>
        </div>
      </div>
    </el-card>

    <!-- 我的团队列表 -->
    <el-row :gutter="16">
      <el-col v-for="team in myTeams" :key="team.teamId" :span="8" style="margin-bottom: 16px;">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>{{ team.name }}</strong>
              <el-tag v-if="team.captainId === auth.currentUser?.userId" size="small" type="warning">队长</el-tag>
            </div>
          </template>
          <div v-for="m in getMembers(team.teamId)" :key="m.id" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="32" :icon="UserFilled" />
              <div style="flex: 1;">
                <div style="font-weight: 500;">{{ m.user?.name || m.studentId }}</div>
                <div style="font-size: .82em; color: #909399;">
                  {{ m.studentId }}
                  <template v-if="m.user?.college"> · {{ m.user.college }}</template>
                  <template v-if="m.user?.major"> · {{ m.user.major }}</template>
                  <template v-if="m.user?.grade"> · {{ m.user.grade }}</template>
                </div>
              </div>
              <el-tag size="small">{{ m.role === 'captain' ? '队长' : '队员' }}</el-tag>
              <el-tag v-if="m.status === 'invited'" size="small" type="warning">待接受</el-tag>
              <el-button
                v-if="team.captainId === auth.currentUser?.userId && m.role === 'member'"
                size="small" type="danger" text
                @click="removeMember(team.teamId, m.id)"
              >移出</el-button>
            </div>
          </div>
          <div v-if="team.captainId === auth.currentUser?.userId" style="margin-top: 12px; display: flex; gap: 8px;">
            <el-button size="small" @click="showInvite(team.teamId)">邀请队员</el-button>
            <el-button size="small" type="danger" @click="deleteTeam(team.teamId)">解散团队</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="myTeams.length === 0 && pendingInvites.length === 0 && !loading" description="暂无团队">
      <el-button type="primary" @click="showCreate = true">创建第一个团队</el-button>
    </el-empty>

    <div v-if="loading" style="text-align: center; padding: 40px;">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>

    <!-- 创建团队对话框 -->
    <el-dialog v-model="showCreate" title="创建团队" width="400px">
      <el-input v-model="newTeamName" placeholder="请输入团队名称" />
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="doCreate" :disabled="!newTeamName.trim()">创建</el-button>
      </template>
    </el-dialog>

    <!-- 邀请队员对话框 -->
    <el-dialog v-model="showInviteDialog" title="邀请队员" width="450px">
      <el-select
        v-model="selectedStudent"
        placeholder="输入学号或姓名搜索..."
        filterable
        remote
        :remote-method="remoteSearch"
        :loading="searching"
        style="width: 100%;"
        no-data-text="未找到匹配的学生"
      >
        <el-option
          v-for="s in searchResults"
          :key="s.userId"
          :label="`${s.name}（${s.userId}）- ${s.college}`"
          :value="s.userId"
        />
      </el-select>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" @click="doInvite" :disabled="!selectedStudent">邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, UserFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useTeamStore } from '@/stores/team'
import { userApi } from '@/api'

const auth = useAuthStore()
const teamStore = useTeamStore()

const loading = ref(false)
const showCreate = ref(false)
const newTeamName = ref('')
const showInviteDialog = ref(false)
const inviteTeamId = ref('')
const selectedStudent = ref('')
const searchResults = ref<User[]>([])
const searching = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await teamStore.fetchMine()
    // 加载待处理邀请
    const invites = await teamStore.fetchPendingInvitations()
    invites.forEach(inv => {
      if (!teamStore.members.find(m => m.id === inv.id)) {
        teamStore.members.push(inv)
      }
    })
  } finally {
    loading.value = false
  }
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function remoteSearch(query: string) {
  if (!query.trim()) {
    searchResults.value = []
    return
  }
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      searchResults.value = await userApi.searchStudents(query)
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const myTeams = computed(() => {
  if (!auth.currentUser) return []
  return teamStore.getByStudent(auth.currentUser.userId)
})

const pendingInvites = computed(() => {
  if (!auth.currentUser) return []
  return teamStore.getPendingInvitations(auth.currentUser.userId)
})

function getMembers(teamId: string) { return teamStore.getMembers(teamId) }
function getTeamName(teamId: string) { return teamStore.getById(teamId)?.name || '未知团队' }

async function doCreate() {
  try {
    await teamStore.create(newTeamName.value.trim())
    ElMessage.success('团队创建成功')
    showCreate.value = false
    newTeamName.value = ''
  } catch {
    ElMessage.error('创建失败')
  }
}

function showInvite(teamId: string) {
  inviteTeamId.value = teamId
  selectedStudent.value = ''
  showInviteDialog.value = true
}

async function doInvite() {
  try {
    await teamStore.inviteMember(inviteTeamId.value, selectedStudent.value)
    ElMessage.success('邀请已发送')
    showInviteDialog.value = false
  } catch {
    ElMessage.error('邀请失败')
  }
}

async function respond(memberId: string, status: 'accepted' | 'rejected') {
  try {
    await teamStore.updateMemberStatus(memberId, status)
    ElMessage.success(status === 'accepted' ? '已加入团队' : '已拒绝邀请')
  } catch {
    ElMessage.error('操作失败')
  }
}

function removeMember(teamId: string, memberId: string) {
  ElMessageBox.confirm('确认移出该队员？', '提示', { type: 'warning' })
    .then(() => teamStore.removeMember(teamId, memberId))
}

function deleteTeam(teamId: string) {
  ElMessageBox.confirm('确认解散团队？此操作不可撤销。', '解散团队', { type: 'warning' })
    .then(() => {
      teamStore.removeTeam(teamId)
      ElMessage.success('团队已解散')
    })
}
</script>
