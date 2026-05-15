// ==================== 用户 ====================
export type UserRole = 'admin' | 'teacher' | 'student'

export interface User {
  userId: string
  name: string
  role: UserRole
  college: string
  major?: string
  grade?: string
  email?: string
  phone?: string
  status: 1 | 0
  banned: boolean
  createdAt: string
}

// ==================== 竞赛 ====================
export type CompetitionStatus =
  | 'draft'        // 草稿
  | 'pending'      // 待审核
  | 'published'    // 已发布（未到报名时间）
  | 'registering'  // 报名中
  | 'reviewing'    // 评审中
  | 'final'        // 决赛阶段
  | 'ended'        // 已结束
  | 'cancelled'    // 已取消

export interface Competition {
  competitionId: string
  title: string
  organizer: string
  category: string
  description: string
  detail?: string
  coverImage?: string
  creatorId: string
  status: CompetitionStatus
  regStart: string
  regEnd: string
  submitStart: string
  submitEnd: string
  reviewStart: string
  reviewEnd: string
  finalTime?: string
  finalLocation?: string
  resultTime: string
  allowFormats: string       // 逗号分隔，如 "zip,rar,pdf,ppt,mp4"
  maxFileSize: number         // MB
  allowIndividual: boolean
  teamMin?: number
  teamMax?: number
  requireAdvisor: boolean
  reviewMode: 'open' | 'blind'
  auditComment?: string
  createdAt: string
  updatedAt: string
}

// ==================== 团队 ====================
export interface Team {
  teamId: string
  name: string
  captainId: string
  createdAt: string
  members?: TeamMember[]
}

export type MemberStatus = 'invited' | 'accepted' | 'rejected'
export type MemberRole = 'captain' | 'member'

export interface TeamMember {
  id: string
  teamId: string
  studentId: string
  role: MemberRole
  status: MemberStatus
  user?: {
    userId: string
    name: string
    college: string
    major?: string
    grade?: string
    email?: string
    phone?: string
  } | null
}

// ==================== 报名 ====================
export type RegistrationStatus = 'registered' | 'submitted' | 'qualified' | 'disqualified'

export interface Registration {
  registrationId: string
  competitionId: string
  teamId?: string
  studentId?: string       // 个人参赛时使用
  workTitle: string
  advisorId?: string
  notes?: string
  status: RegistrationStatus
  isFinalist: boolean
  createdAt: string
}

// ==================== 作品文件 ====================
export interface WorkFile {
  fileId: string
  registrationId: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

// ==================== 评分标准 ====================
export interface ScoringRubric {
  rubricId: string
  competitionId: string
  name: string
  maxScore: number
  weight: number
  sortOrder: number
}

// ==================== 评委指派 ====================
export interface ReviewerAssignment {
  id: string
  competitionId: string
  teacherId: string
  assignedAt: string
}

// ==================== 评分 ====================
export type ReviewStatus = 'draft' | 'submitted'

export interface Review {
  reviewId: string
  registrationId: string
  reviewerId: string
  totalScore?: number
  comment?: string
  status: ReviewStatus
  submittedAt?: string
}

export interface ReviewDetail {
  id: string
  reviewId: string
  rubricId: string
  score: number
}

// ==================== 奖项 ====================
export interface Award {
  awardId: string
  competitionId: string
  name: string
  quota: number
  registrationId?: string   // 获奖报名ID（公布后填入）
}

// ==================== 消息 ====================
export interface Notification {
  notificationId: string
  userId: string
  title: string
  content: string
  read: boolean
  createdAt: string
}

// ==================== 意见反馈 ====================
export type FeedbackStatus = 'open' | 'resolved'

export interface Feedback {
  feedbackId: string
  userId: string
  title: string
  content: string
  status: FeedbackStatus
  adminReply?: string
  createdAt: string
  updatedAt: string
  user?: {
    userId: string
    name: string
    role: string
    college: string
  } | null
}

// ==================== 邀请码 ====================
export interface InviteCode {
  code: string
  createdBy: string
  creator?: {
    userId: string
    name: string
  }
  maxUses: number
  usedCount: number
  colleges: string[]
  role: string
  createdAt: string
  expiresAt?: string
}

// ==================== 系统配置 ====================
export interface SystemConfig {
  schoolName: string
  colleges: string[]
  categories: string[]
}
