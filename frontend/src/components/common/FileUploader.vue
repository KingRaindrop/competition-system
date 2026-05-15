<template>
  <div>
    <el-upload
      v-model:file-list="fileList"
      :auto-upload="false"
      :limit="10"
      :accept="acceptStr"
      :before-upload="beforeUpload"
      :disabled="disabled"
      drag
      multiple
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">
          允许格式: {{ allowFormats }} &nbsp;|&nbsp; 单文件最大 {{ maxSize }}MB
        </div>
      </template>
    </el-upload>
    <div v-if="fileList.length > 0" style="margin-top: 12px;">
      <el-button type="primary" @click="confirmUpload">确认提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'

const props = defineProps<{
  allowFormats: string
  maxSize: number
  existingFiles: { fileName: string; fileSize: number; fileType: string }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  upload: [files: File[]]
}>()

const fileList = ref<UploadFile[]>([])
const acceptStr = computed(() => {
  return props.allowFormats.split(',').map(f => '.' + f.trim()).join(',')
})

function beforeUpload(file: UploadRawFile) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const allowed = props.allowFormats.split(',').map(f => f.trim().toLowerCase())
  if (!allowed.includes(ext)) {
    ElMessage.error(`不支持的文件格式: .${ext}，仅允许: ${props.allowFormats}`)
    return false
  }
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件过大: ${file.name}，最大允许 ${props.maxSize}MB`)
    return false
  }
  return true
}

function confirmUpload() {
  const files = fileList.value
    .map(f => f.raw)
    .filter((file): file is UploadRawFile => !!file)
  emit('upload', files)
}
</script>
