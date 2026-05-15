<template>
  <div>
    <h2 style="margin-bottom: 20px;">邀请码管理</h2>

    <el-card style="margin-bottom: 20px;">
      <template #header><span style="font-weight: 600;">生成邀请码</span></template>
      <el-form label-width="100px">
        <el-form-item label="适用学院">
          <el-select
            v-model="genForm.colleges"
            multiple
            placeholder="请选择适用学院（可多选）"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="col in collegeOptions"
              :key="col"
              :label="col"
              :value="col"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="auth.userRole === 'admin'" label="初始角色">
          <el-radio-group v-model="genForm.role">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
          </el-radio-group>
          <span style="font-size: .8em; color: #909399; margin-left: 8px;">使用该邀请码注册后的初始身份</span>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="每码上限">
              <el-input-number v-model="genForm.maxUses" :min="1" :max="10000" style="width: 100%;" />
              <span style="font-size: .8em; color: #909399; margin-left: 8px;">每个邀请码可注册次数</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生成数量">
              <el-input-number v-model="genForm.count" :min="1" :max="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8" style="display: flex; align-items: center;">
            <el-button type="primary" :loading="generating" @click="doGenerate" style="margin-left: 20px;">
              生成邀请码
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card v-if="generatedCodes.length">
      <template #header><span style="font-weight: 600; color: #67c23a;">新生成的邀请码</span></template>
      <div style="margin-bottom: 12px;">
        <el-button size="small" @click="copyAll">一键复制全部</el-button>
        <el-button size="small" @click="generatedCodes = []">清空</el-button>
      </div>
      <el-table :data="generatedCodes" stripe size="small">
        <el-table-column prop="code" label="邀请码" width="160">
          <template #default="{ row }">
            <el-tag type="success" size="small" style="font-family: monospace; letter-spacing: 2px;">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用学院" min-width="300">
          <template #default="{ row }">
            <el-tag v-for="c in row.colleges" :key="c" size="small" style="margin-right: 4px;">{{ c }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'teacher' ? 'warning' : 'info'" size="small">{{ row.role === 'teacher' ? '教师' : '学生' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxUses" label="上限" width="60" />
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">已有邀请码</span>
          <el-button size="small" @click="store.fetchAll()">刷新</el-button>
        </div>
      </template>
      <el-table v-if="store.codes.length" :data="store.codes" stripe>
        <el-table-column prop="code" label="邀请码" width="150">
          <template #default="{ row }">
            <span style="font-family: monospace; letter-spacing: 1px;">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="适用学院" min-width="280">
          <template #default="{ row }">
            <el-tag v-for="c in row.colleges" :key="c" size="small" style="margin-right: 4px;">{{ c }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'teacher' ? 'warning' : 'info'" size="small">{{ row.role === 'teacher' ? '教师' : '学生' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用情况" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.maxUses ? Math.round(row.usedCount / row.maxUses * 100) : 0"
              :status="row.usedCount >= row.maxUses ? 'success' : undefined"
              :text-inside="true"
            />
            <span style="font-size: .82em; color: #909399;">{{ row.usedCount }} / {{ row.maxUses }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建者" width="120">
          <template #default="{ row }">{{ row.creator?.name || row.createdBy }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-popconfirm title="确认删除该邀请码？已使用的注册不受影响。" @confirm="doDelete(row.code)">
              <template #reference>
                <el-button size="small" type="danger" text>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无邀请码" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useInviteCodeStore } from '@/stores/inviteCode'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api'
import { formatDate } from '@/utils/format'

const store = useInviteCodeStore()
const auth = useAuthStore()
const generating = ref(false)
const generatedCodes = ref<any[]>([])
const collegeOptions = ref<string[]>([])

const genForm = reactive({
  colleges: [] as string[],
  role: 'student' as string,
  maxUses: 50,
  count: 1,
})

onMounted(async () => {
  try {
    const config = await userApi.getSystemConfig()
    collegeOptions.value = config.colleges
  } catch { /* fallback */ }
  await store.fetchAll()
})

async function doGenerate() {
  if (genForm.colleges.length === 0) {
    ElMessage.warning('请选择至少一个学院')
    return
  }
  generating.value = true
  try {
    const created = await store.generate(genForm.maxUses, genForm.colleges, genForm.count, genForm.role)
    generatedCodes.value = created
    ElMessage.success(`已生成 ${created.length} 个邀请码`)
  } catch (e: any) {
    ElMessage.error(e?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

async function doDelete(code: string) {
  try {
    await store.remove(code)
    generatedCodes.value = generatedCodes.value.filter(c => c.code !== code)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

async function copyAll() {
  const text = generatedCodes.value.map(c => c.code).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制 ${generatedCodes.value.length} 个邀请码`)
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}
</script>
