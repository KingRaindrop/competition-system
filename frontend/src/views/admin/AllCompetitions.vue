<template>
  <div>
    <h2 style="margin-bottom: 20px;">全部竞赛管理</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
    </el-tabs>

    <el-table :data="filteredList" stripe>
      <el-table-column prop="title" label="竞赛名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="organizer" label="主办单位" width="120" />
      <el-table-column label="创建者" width="100">
        <template #default="{ row }">{{ getUserName(row.creatorId) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="报名时间" width="200">
        <template #default="{ row }">{{ formatDate(row.regStart) }} ~ {{ formatDate(row.regEnd) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/competition/${row.competitionId}`)">查看</el-button>
          <el-dropdown @command="(cmd: string) => handleAction(cmd, row)" style="margin-left: 8px;">
            <el-button size="small">更多 <el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="manage">竞赛综合管理</el-dropdown-item>
                <el-dropdown-item command="edit">编辑设置</el-dropdown-item>
                <el-dropdown-item command="cancel" v-if="row.status !== 'cancelled' && row.status !== 'ended'">下架竞赛</el-dropdown-item>
                <el-dropdown-item command="delete">删除竞赛</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑竞赛对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑竞赛设置" width="750px" @close="resetEditForm">
      <template v-if="editComp">
        <el-tabs v-model="editTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form :model="editForm" label-width="100px">
              <el-form-item label="竞赛名称">
                <el-input v-model="editForm.title" />
              </el-form-item>
              <el-form-item label="主办单位">
                <el-input v-model="editForm.organizer" />
              </el-form-item>
              <el-form-item label="学科分类">
                <el-select v-model="editForm.category" style="width: 100%;">
                  <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
                </el-select>
              </el-form-item>
              <el-form-item label="简要描述">
                <el-input v-model="editForm.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="详细说明">
                <el-input v-model="editForm.detail" type="textarea" :rows="4" placeholder="支持HTML" />
              </el-form-item>
              <el-form-item label="封面图片URL">
                <el-input v-model="editForm.coverImage" placeholder="图片链接（选填）" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 时间设置 -->
          <el-tab-pane label="时间设置" name="time">
            <el-form :model="editForm" label-width="120px">
              <el-divider content-position="left">报名</el-divider>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="报名开始">
                    <el-date-picker v-model="editForm.regStart" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="报名截止">
                    <el-date-picker v-model="editForm.regEnd" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">作品上传</el-divider>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="上传开始">
                    <el-date-picker v-model="editForm.submitStart" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="上传截止">
                    <el-date-picker v-model="editForm.submitEnd" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">评审</el-divider>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="评审开始">
                    <el-date-picker v-model="editForm.reviewStart" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="评审截止">
                    <el-date-picker v-model="editForm.reviewEnd" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">决赛 & 结果</el-divider>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="决赛时间">
                    <el-date-picker v-model="editForm.finalTime" type="datetime" placeholder="选择日期（选填）" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="决赛地点">
                    <el-input v-model="editForm.finalLocation" placeholder="决赛地点（选填）" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="结果公布时间">
                <el-date-picker v-model="editForm.resultTime" type="datetime" placeholder="选择日期" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 参赛约束 -->
          <el-tab-pane label="参赛约束" name="constraints">
            <el-form :model="editForm" label-width="120px">
              <el-form-item label="作品格式">
                <el-input v-model="editForm.allowFormats" placeholder="逗号分隔，如 zip,rar,pdf,ppt,mp4" />
              </el-form-item>
              <el-form-item label="单文件上限(MB)">
                <el-input-number v-model="editForm.maxFileSize" :min="1" :max="5000" />
              </el-form-item>
              <el-divider />
              <el-form-item label="允许个人参赛">
                <el-switch v-model="editForm.allowIndividual" />
              </el-form-item>
              <el-row :gutter="16" v-if="!editForm.allowIndividual">
                <el-col :span="12">
                  <el-form-item label="最少人数">
                    <el-input-number v-model="editForm.teamMin" :min="1" :max="20" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最多人数">
                    <el-input-number v-model="editForm.teamMax" :min="2" :max="50" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-divider />
              <el-form-item label="必须指导老师">
                <el-switch v-model="editForm.requireAdvisor" />
              </el-form-item>
              <el-form-item label="评审模式">
                <el-radio-group v-model="editForm.reviewMode">
                  <el-radio value="open">公开评审</el-radio>
                  <el-radio value="blind">盲评</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </template>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCompetitionStore } from '@/stores/competition'
import type { Competition } from '@/types'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/common/StatusTag.vue'

const router = useRouter()
const auth = useAuthStore()
const compStore = useCompetitionStore()
const activeTab = ref('all')
const saving = ref(false)
const editTab = ref('basic')

const categories = ['理工类', '人文社科类', '经管类', '艺术体育类', '创新创业类', '综合类']

onMounted(async () => {
  await compStore.fetchAll()
  await auth.fetchAllUsers()
})

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'pending', label: '待审核' },
  { key: 'active', label: '进行中' },
  { key: 'ended', label: '已结束' },
]

const filteredList = computed(() => {
  switch (activeTab.value) {
    case 'draft': return compStore.getByStatus('draft')
    case 'pending': return compStore.getByStatus('pending')
    case 'active': return compStore.all().filter(c => ['published', 'registering', 'reviewing', 'final'].includes(c.status))
    case 'ended': return compStore.all().filter(c => ['ended', 'cancelled'].includes(c.status))
    default: return compStore.all()
  }
})

function getUserName(id: string) { return auth.users.find(u => u.userId === id)?.name || id }

// ============ 编辑对话框 ============
const showEditDialog = ref(false)
const editComp = ref<Competition | null>(null)

const editForm = reactive({
  title: '',
  organizer: '',
  category: '',
  description: '',
  detail: '',
  coverImage: '',
  regStart: '',
  regEnd: '',
  submitStart: '',
  submitEnd: '',
  reviewStart: '',
  reviewEnd: '',
  finalTime: '',
  finalLocation: '',
  resultTime: '',
  allowFormats: '',
  maxFileSize: 100,
  allowIndividual: false,
  teamMin: undefined as number | undefined,
  teamMax: undefined as number | undefined,
  requireAdvisor: false,
  reviewMode: 'open' as 'open' | 'blind',
})

function openEditDialog(comp: Competition) {
  editComp.value = comp
  editForm.title = comp.title
  editForm.organizer = comp.organizer
  editForm.category = comp.category
  editForm.description = comp.description
  editForm.detail = comp.detail || ''
  editForm.coverImage = comp.coverImage || ''
  editForm.regStart = comp.regStart
  editForm.regEnd = comp.regEnd
  editForm.submitStart = comp.submitStart
  editForm.submitEnd = comp.submitEnd
  editForm.reviewStart = comp.reviewStart
  editForm.reviewEnd = comp.reviewEnd
  editForm.finalTime = comp.finalTime || ''
  editForm.finalLocation = comp.finalLocation || ''
  editForm.resultTime = comp.resultTime
  editForm.allowFormats = comp.allowFormats
  editForm.maxFileSize = comp.maxFileSize
  editForm.allowIndividual = comp.allowIndividual
  editForm.teamMin = comp.teamMin
  editForm.teamMax = comp.teamMax
  editForm.requireAdvisor = comp.requireAdvisor
  editForm.reviewMode = comp.reviewMode
  editTab.value = 'basic'
  showEditDialog.value = true
}

function resetEditForm() {
  editComp.value = null
}

async function saveEdit() {
  if (!editComp.value) return
  saving.value = true
  try {
    await compStore.update(editComp.value.competitionId, {
      title: editForm.title,
      organizer: editForm.organizer,
      category: editForm.category,
      description: editForm.description,
      detail: editForm.detail || undefined,
      coverImage: editForm.coverImage || undefined,
      regStart: editForm.regStart,
      regEnd: editForm.regEnd,
      submitStart: editForm.submitStart,
      submitEnd: editForm.submitEnd,
      reviewStart: editForm.reviewStart,
      reviewEnd: editForm.reviewEnd,
      finalTime: editForm.finalTime || undefined,
      finalLocation: editForm.finalLocation || undefined,
      resultTime: editForm.resultTime,
      allowFormats: editForm.allowFormats,
      maxFileSize: editForm.maxFileSize,
      allowIndividual: editForm.allowIndividual,
      teamMin: editForm.teamMin ?? undefined,
      teamMax: editForm.teamMax ?? undefined,
      requireAdvisor: editForm.requireAdvisor,
      reviewMode: editForm.reviewMode,
    })
    ElMessage.success('竞赛设置已更新')
    showEditDialog.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ============ 其他操作 ============
async function handleAction(cmd: string, row: Competition) {
  if (cmd === 'manage') {
    router.push(`/teacher/manage/${row.competitionId}`)
  } else if (cmd === 'edit') {
    openEditDialog(row)
  } else if (cmd === 'cancel') {
    try {
      await ElMessageBox.confirm('确认下架该竞赛？下架后学生将无法看到。', '下架竞赛', { type: 'warning' })
      await compStore.cancel(row.competitionId)
      ElMessage.success('已下架')
    } catch { /* user cancelled */ }
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确认删除该竞赛？此操作不可撤销。', '删除竞赛', { type: 'warning' })
      await compStore.remove(row.competitionId)
      ElMessage.success('已删除')
    } catch { /* user cancelled */ }
  }
}
</script>
