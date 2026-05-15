/** 返回本地时间的 ISO 字符串，格式与日期选择器 value-format="YYYY-MM-DDTHH:mm:ss" 一致 */
export function nowLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    registering: '报名中',
    reviewing: '评审中',
    final: '决赛阶段',
    ended: '已结束',
    cancelled: '已取消',
    registered: '已报名',
    submitted: '已提交',
    qualified: '已入围',
    disqualified: '已淘汰',
    invited: '待接受',
    accepted: '已加入',
    rejected: '已拒绝',
  }
  return map[status] || status
}

export function getStatusType(status: string): string {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    published: 'success',
    registering: '',
    reviewing: 'warning',
    final: '',
    ended: 'info',
    cancelled: 'danger',
    registered: '',
    submitted: 'success',
    qualified: 'success',
    disqualified: 'danger',
  }
  return map[status] || ''
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
