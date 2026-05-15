import type {
  User, Competition, Team, TeamMember, Registration,
  WorkFile, ScoringRubric, ReviewerAssignment,
  Review, ReviewDetail, Award, Notification,
} from '@/types'

// ==================== localStorage 工具 ====================
const DEBUG = true

// 检测 localStorage 是否可用
function storageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

const STORAGE_OK = storageAvailable()
if (!STORAGE_OK && typeof window !== 'undefined') {
  console.error('[data] localStorage 不可用！数据将无法持久化。请检查浏览器隐私设置或是否处于无痕模式。')
}

function load<T>(key: string, fallback: T): T {
  if (!STORAGE_OK) {
    console.warn(`[data] load "${key}" → localStorage 不可用，使用默认值`)
    return fallback
  }
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      if (DEBUG) console.log(`[data] load "${key}" → 空，使用默认值`)
      return fallback
    }
    const parsed = JSON.parse(raw)
    if (DEBUG) console.log(`[data] load "${key}" → ${Array.isArray(parsed) ? parsed.length + '条' : typeof parsed}`)
    return parsed
  } catch (e) {
    console.error(`[data] load "${key}" 解析失败:`, e, '→ 使用默认值')
    return fallback
  }
}

function save(key: string, data: unknown) {
  if (!STORAGE_OK) {
    console.warn(`[data] save "${key}" → localStorage 不可用，跳过保存`)
    return
  }
  try {
    const json = JSON.stringify(data)
    localStorage.setItem(key, json)
    const verify = localStorage.getItem(key)
    if (verify !== json) {
      console.error(`[data] save "${key}" 验证失败！写入: ${json.length}字符, 读取: ${verify?.length ?? 0}字符`)
    } else if (DEBUG) {
      try {
        const arr = JSON.parse(verify)
        console.log(`[data] save "${key}" → ${Array.isArray(arr) ? arr.length + '条' : typeof arr}`)
      } catch { /* 解析日志用，不影响主流程 */ }
    }
  } catch (e) {
    console.error(`[data] save "${key}" 失败:`, e)
  }
}

// ==================== 基础数据 ====================
const now = new Date()
function d(offsetDays: number, hour = 0, minute = 0): string {
  const dt = new Date(now)
  dt.setDate(dt.getDate() + offsetDays)
  dt.setHours(hour, minute, 0, 0)
  return dt.toISOString()
}

export const defaultUsers: User[] = [
  { userId: 'admin01', name: '系统管理员', role: 'admin', college: '教务处', email: 'admin@jyu.edu.cn', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'T2021001', name: '张教授', role: 'teacher', college: '计算机学院', major: '计算机科学与技术', email: 'zhang@jyu.edu.cn', phone: '13800001111', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'T2021002', name: '李教授', role: 'teacher', college: '计算机学院', major: '软件工程', email: 'li@jyu.edu.cn', phone: '13800002222', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'T2021003', name: '王教授', role: 'teacher', college: '电子信息工程学院', major: '电子信息工程', email: 'wang@jyu.edu.cn', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'S2024001', name: '张三', role: 'student', college: '计算机学院', major: '计算机科学与技术', grade: '2024级', email: 'zhangsan@stu.jyu.edu.cn', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'S2024002', name: '李四', role: 'student', college: '计算机学院', major: '软件工程', grade: '2024级', email: 'lisi@stu.jyu.edu.cn', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'S2024003', name: '王五', role: 'student', college: '电子信息工程学院', major: '电子信息工程', grade: '2024级', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'S2024004', name: '赵六', role: 'student', college: '计算机学院', major: '网络工程', grade: '2024级', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
  { userId: 'S2023001', name: '孙七', role: 'student', college: '数学学院', major: '数学与应用数学', grade: '2023级', status: 1, banned: false, createdAt: '2025-09-01T00:00:00.000Z' },
]

export const defaultCompetitions: Competition[] = [
  {
    competitionId: 'comp001',
    title: '2026年大学生计算机设计大赛校内选拔赛',
    organizer: '计算机学院',
    category: '理工类',
    description: '选拔优秀作品参加省级大学生计算机设计大赛，涵盖软件应用开发、人工智能应用、数字媒体设计等方向。',
    detail: '<h3>比赛背景</h3><p>大学生计算机设计大赛是面向全国高校学生的重要学科竞赛。本次校内选拔赛旨在遴选优秀作品代表学校参加省赛。</p><h3>参赛要求</h3><ul><li>作品必须为原创，不得抄袭</li><li>每队不超过5人</li><li>需要指导老师</li></ul>',
    coverImage: '',
    creatorId: 'T2021001',
    status: 'registering',
    regStart: d(-5, 8, 0),
    regEnd: d(10, 23, 59),
    submitStart: d(11, 8, 0),
    submitEnd: d(20, 23, 59),
    reviewStart: d(21, 8, 0),
    reviewEnd: d(28, 23, 59),
    finalTime: d(35, 14, 0),
    finalLocation: '田家炳教学楼 301 会议室',
    resultTime: d(38, 10, 0),
    allowFormats: 'zip,rar,pdf,ppt,pptx,mp4,jpg,png',
    maxFileSize: 100,
    allowIndividual: false,
    teamMin: 2,
    teamMax: 5,
    requireAdvisor: true,
    reviewMode: 'open',
    createdAt: d(-10, 0, 0),
    updatedAt: d(-10, 0, 0),
  },
  {
    competitionId: 'comp002',
    title: '创新创业项目路演大赛',
    organizer: '创新创业学院',
    category: '创新创业类',
    description: '面向全校学生的创新创业项目路演比赛，展示创新思维与商业策划能力。',
    detail: '<h3>比赛主题</h3><p>创新引领未来，创业成就梦想</p><h3>比赛形式</h3><p>初赛：提交商业策划书PPT；决赛：现场路演答辩。</p>',
    coverImage: '',
    creatorId: 'T2021002',
    status: 'pending',
    regStart: d(20, 8, 0),
    regEnd: d(35, 23, 59),
    submitStart: d(36, 8, 0),
    submitEnd: d(45, 23, 59),
    reviewStart: d(46, 8, 0),
    reviewEnd: d(50, 23, 59),
    finalTime: d(58, 14, 0),
    finalLocation: '文科楼 101 报告厅',
    resultTime: d(60, 10, 0),
    allowFormats: 'pdf,ppt,pptx,doc,docx',
    maxFileSize: 50,
    allowIndividual: true,
    teamMin: 1,
    teamMax: 4,
    requireAdvisor: false,
    reviewMode: 'blind',
    createdAt: d(-3, 0, 0),
    updatedAt: d(-3, 0, 0),
  },
  {
    competitionId: 'comp003',
    title: '数学建模竞赛校内选拔赛',
    organizer: '数学学院',
    category: '理工类',
    description: '面向全校的数学建模竞赛，选拔队伍参加全国大学生数学建模竞赛。',
    detail: '<h3>比赛说明</h3><p>三人一组，在指定时间内完成数学建模题目并提交论文。</p>',
    coverImage: '',
    creatorId: 'T2021001',
    status: 'reviewing',
    regStart: d(-30, 8, 0),
    regEnd: d(-20, 23, 59),
    submitStart: d(-19, 8, 0),
    submitEnd: d(-10, 23, 59),
    reviewStart: d(-9, 8, 0),
    reviewEnd: d(2, 23, 59),
    finalTime: d(8, 14, 0),
    finalLocation: '田家炳教学楼 201 教室',
    resultTime: d(10, 10, 0),
    allowFormats: 'pdf,doc,docx,zip',
    maxFileSize: 30,
    allowIndividual: false,
    teamMin: 3,
    teamMax: 3,
    requireAdvisor: true,
    reviewMode: 'blind',
    createdAt: d(-35, 0, 0),
    updatedAt: d(-35, 0, 0),
  },
  {
    competitionId: 'comp004',
    title: '程序设计竞赛（ACM校赛）',
    organizer: '计算机学院',
    category: '理工类',
    description: 'ACM/ICPC 风格的团队编程竞赛，考察算法与数据结构能力。',
    detail: '<h3>比赛形式</h3><p>3人一队，5小时内完成8-12道编程题，在线评测系统实时排名。</p>',
    coverImage: '',
    creatorId: 'T2021002',
    status: 'draft',
    regStart: d(15, 8, 0),
    regEnd: d(30, 23, 59),
    submitStart: d(15, 8, 0),
    submitEnd: d(30, 23, 59),
    reviewStart: d(31, 8, 0),
    reviewEnd: d(32, 23, 59),
    finalTime: d(33, 9, 0),
    finalLocation: '锡昌科技楼 501 机房',
    resultTime: d(33, 18, 0),
    allowFormats: 'zip,pdf',
    maxFileSize: 20,
    allowIndividual: false,
    teamMin: 3,
    teamMax: 3,
    requireAdvisor: false,
    reviewMode: 'open',
    createdAt: d(-2, 0, 0),
    updatedAt: d(-2, 0, 0),
  },
  {
    competitionId: 'comp005',
    title: '英语演讲比赛',
    organizer: '外国语学院',
    category: '人文社科类',
    description: '全校英语演讲比赛，展示英语表达与演讲风采。',
    detail: '<h3>比赛主题</h3><p>The Future is Now</p>',
    coverImage: '',
    creatorId: 'T2021003',
    status: 'ended',
    regStart: d(-50, 8, 0),
    regEnd: d(-40, 23, 59),
    submitStart: d(-39, 8, 0),
    submitEnd: d(-30, 23, 59),
    reviewStart: d(-29, 8, 0),
    reviewEnd: d(-22, 23, 59),
    finalTime: d(-15, 14, 0),
    finalLocation: '金利来学术报告厅',
    resultTime: d(-12, 10, 0),
    allowFormats: 'mp4,ppt,pptx',
    maxFileSize: 200,
    allowIndividual: true,
    teamMin: 1,
    teamMax: 1,
    requireAdvisor: false,
    reviewMode: 'blind',
    createdAt: d(-55, 0, 0),
    updatedAt: d(-55, 0, 0),
  },
]

export const defaultTeams: Team[] = [
  { teamId: 'team001', name: '码农突击队', captainId: 'S2024001', createdAt: d(-3, 10, 0) },
  { teamId: 'team002', name: '数学建模必胜队', captainId: 'S2023001', createdAt: d(-25, 9, 0) },
]

export const defaultTeamMembers: TeamMember[] = [
  { id: 'tm001', teamId: 'team001', studentId: 'S2024001', role: 'captain', status: 'accepted' },
  { id: 'tm002', teamId: 'team001', studentId: 'S2024002', role: 'member', status: 'accepted' },
  { id: 'tm003', teamId: 'team001', studentId: 'S2024004', role: 'member', status: 'invited' },
  { id: 'tm004', teamId: 'team002', studentId: 'S2023001', role: 'captain', status: 'accepted' },
]

export const defaultRegistrations: Registration[] = [
  { registrationId: 'reg001', competitionId: 'comp001', teamId: 'team001', workTitle: '智慧校园服务平台', advisorId: 'T2021001', status: 'registered', createdAt: d(-3, 14, 0), isFinalist: false },
  { registrationId: 'reg002', competitionId: 'comp003', teamId: 'team002', workTitle: '基于神经网络的股票预测模型', advisorId: 'T2021001', status: 'submitted', createdAt: d(-22, 9, 0), isFinalist: false },
  { registrationId: 'reg003', competitionId: 'comp005', studentId: 'S2024003', workTitle: 'The Future of AI', advisorId: 'T2021003', status: 'submitted', createdAt: d(-45, 11, 0), isFinalist: false },
]

export const defaultWorkFiles: WorkFile[] = [
  { fileId: 'wf001', registrationId: 'reg002', fileName: '数学建模论文.pdf', filePath: '/files/reg002/paper.pdf', fileSize: 2.5 * 1024 * 1024, fileType: 'pdf', uploadedAt: d(-19, 15, 0) },
  { fileId: 'wf002', registrationId: 'reg003', fileName: '英语演讲视频.mp4', filePath: '/files/reg003/speech.mp4', fileSize: 150 * 1024 * 1024, fileType: 'mp4', uploadedAt: d(-38, 10, 0) },
  { fileId: 'wf003', registrationId: 'reg003', fileName: '演讲PPT.pptx', filePath: '/files/reg003/slides.pptx', fileSize: 5 * 1024 * 1024, fileType: 'pptx', uploadedAt: d(-38, 10, 30) },
]

export const defaultRubrics: ScoringRubric[] = [
  { rubricId: 'rub001', competitionId: 'comp003', name: '模型建立', maxScore: 30, weight: 0.3, sortOrder: 1 },
  { rubricId: 'rub002', competitionId: 'comp003', name: '求解方法', maxScore: 30, weight: 0.3, sortOrder: 2 },
  { rubricId: 'rub003', competitionId: 'comp003', name: '论文写作', maxScore: 20, weight: 0.2, sortOrder: 3 },
  { rubricId: 'rub004', competitionId: 'comp003', name: '创新性', maxScore: 20, weight: 0.2, sortOrder: 4 },
  { rubricId: 'rub005', competitionId: 'comp005', name: '演讲内容', maxScore: 40, weight: 0.4, sortOrder: 1 },
  { rubricId: 'rub006', competitionId: 'comp005', name: '语言表达', maxScore: 30, weight: 0.3, sortOrder: 2 },
  { rubricId: 'rub007', competitionId: 'comp005', name: '台风表现', maxScore: 30, weight: 0.3, sortOrder: 3 },
]

export const defaultReviewerAssignments: ReviewerAssignment[] = [
  { id: 'ra001', competitionId: 'comp003', teacherId: 'T2021001', assignedAt: d(-12, 9, 0) },
  { id: 'ra002', competitionId: 'comp003', teacherId: 'T2021002', assignedAt: d(-12, 9, 0) },
  { id: 'ra003', competitionId: 'comp003', teacherId: 'T2021003', assignedAt: d(-12, 9, 0) },
]

export const defaultReviews: Review[] = [
  { reviewId: 'rev001', registrationId: 'reg002', reviewerId: 'T2021002', totalScore: 85, comment: '模型设计合理，论证充分，建议进入决赛。', status: 'submitted', submittedAt: d(-8, 10, 0) },
  { reviewId: 'rev002', registrationId: 'reg002', reviewerId: 'T2021003', totalScore: 78, comment: '整体不错，创新性可进一步加强。', status: 'submitted', submittedAt: d(-7, 14, 0) },
]

export const defaultReviewDetails: ReviewDetail[] = [
  { id: 'rd001', reviewId: 'rev001', rubricId: 'rub001', score: 26 },
  { id: 'rd002', reviewId: 'rev001', rubricId: 'rub002', score: 25 },
  { id: 'rd003', reviewId: 'rev001', rubricId: 'rub003', score: 17 },
  { id: 'rd004', reviewId: 'rev001', rubricId: 'rub004', score: 17 },
  { id: 'rd005', reviewId: 'rev002', rubricId: 'rub001', score: 23 },
  { id: 'rd006', reviewId: 'rev002', rubricId: 'rub002', score: 24 },
  { id: 'rd007', reviewId: 'rev002', rubricId: 'rub003', score: 16 },
  { id: 'rd008', reviewId: 'rev002', rubricId: 'rub004', score: 15 },
]

export const defaultAwards: Award[] = [
  { awardId: 'aw001', competitionId: 'comp005', name: '一等奖', quota: 1, registrationId: 'reg003' },
  { awardId: 'aw002', competitionId: 'comp005', name: '二等奖', quota: 2 },
  { awardId: 'aw003', competitionId: 'comp005', name: '三等奖', quota: 3 },
]

export const defaultNotifications: Notification[] = [
  { notificationId: 'n001', userId: 'S2024001', title: '报名成功', content: '你已成功报名"大学生计算机设计大赛校内选拔赛"，请按时提交作品。', read: false, createdAt: d(-3, 14, 10) },
  { notificationId: 'n002', userId: 'S2024001', title: '团队邀请', content: '你已被邀请加入"码农突击队"团队。', read: true, createdAt: d(-3, 10, 0) },
  { notificationId: 'n003', userId: 'T2021001', title: '竞赛审核通知', content: '你创建的"大学生计算机设计大赛校内选拔赛"已通过审核，现已发布。', read: false, createdAt: d(-6, 9, 0) },
  { notificationId: 'n004', userId: 'T2021002', title: '评审邀请', content: '你已被指派为"数学建模竞赛校内选拔赛"评委，请按时完成评审。', read: false, createdAt: d(-12, 9, 0) },
]

// ==================== 数据初始化 ====================
const KEYS = {
  users: 'comp_sys_users',
  competitions: 'comp_sys_competitions',
  teams: 'comp_sys_teams',
  teamMembers: 'comp_sys_team_members',
  registrations: 'comp_sys_registrations',
  workFiles: 'comp_sys_work_files',
  rubrics: 'comp_sys_rubrics',
  reviewerAssignments: 'comp_sys_reviewer_assignments',
  reviews: 'comp_sys_reviews',
  reviewDetails: 'comp_sys_review_details',
  awards: 'comp_sys_awards',
  notifications: 'comp_sys_notifications',
  currentUser: 'comp_sys_current_user',
  config: 'comp_sys_config',
}

export function initData() {
  let initialized = 0
  let skipped = 0
  const entries: [string, unknown][] = [
    [KEYS.users, defaultUsers],
    [KEYS.competitions, defaultCompetitions],
    [KEYS.teams, defaultTeams],
    [KEYS.teamMembers, defaultTeamMembers],
    [KEYS.registrations, defaultRegistrations],
    [KEYS.workFiles, defaultWorkFiles],
    [KEYS.rubrics, defaultRubrics],
    [KEYS.reviewerAssignments, defaultReviewerAssignments],
    [KEYS.reviews, defaultReviews],
    [KEYS.reviewDetails, defaultReviewDetails],
    [KEYS.awards, defaultAwards],
    [KEYS.notifications, defaultNotifications],
  ]
  for (const [key, defaultData] of entries) {
    if (!localStorage.getItem(key)) {
      save(key, defaultData)
      initialized++
    } else {
      skipped++
    }
  }
  if (DEBUG) console.log(`[data] initData 完成: 初始化 ${initialized} 项, 已存在 ${skipped} 项`)
}

// ==================== 通用数据访问 ====================
export function getStore() {
  return {
    // Users
    get users(): User[] { return load<User[]>(KEYS.users, defaultUsers) },
    set users(v: User[]) { save(KEYS.users, v) },

    // Competitions
    get competitions(): Competition[] { return load<Competition[]>(KEYS.competitions, defaultCompetitions) },
    set competitions(v: Competition[]) { save(KEYS.competitions, v) },

    // Teams
    get teams(): Team[] { return load<Team[]>(KEYS.teams, defaultTeams) },
    set teams(v: Team[]) { save(KEYS.teams, v) },

    // Team Members
    get teamMembers(): TeamMember[] { return load<TeamMember[]>(KEYS.teamMembers, defaultTeamMembers) },
    set teamMembers(v: TeamMember[]) { save(KEYS.teamMembers, v) },

    // Registrations
    get registrations(): Registration[] { return load<Registration[]>(KEYS.registrations, defaultRegistrations) },
    set registrations(v: Registration[]) { save(KEYS.registrations, v) },

    // Work Files
    get workFiles(): WorkFile[] { return load<WorkFile[]>(KEYS.workFiles, defaultWorkFiles) },
    set workFiles(v: WorkFile[]) { save(KEYS.workFiles, v) },

    // Rubrics
    get rubrics(): ScoringRubric[] { return load<ScoringRubric[]>(KEYS.rubrics, defaultRubrics) },
    set rubrics(v: ScoringRubric[]) { save(KEYS.rubrics, v) },

    // Reviewer Assignments
    get reviewerAssignments(): ReviewerAssignment[] { return load<ReviewerAssignment[]>(KEYS.reviewerAssignments, defaultReviewerAssignments) },
    set reviewerAssignments(v: ReviewerAssignment[]) { save(KEYS.reviewerAssignments, v) },

    // Reviews
    get reviews(): Review[] { return load<Review[]>(KEYS.reviews, defaultReviews) },
    set reviews(v: Review[]) { save(KEYS.reviews, v) },

    // Review Details
    get reviewDetails(): ReviewDetail[] { return load<ReviewDetail[]>(KEYS.reviewDetails, defaultReviewDetails) },
    set reviewDetails(v: ReviewDetail[]) { save(KEYS.reviewDetails, v) },

    // Awards
    get awards(): Award[] { return load<Award[]>(KEYS.awards, defaultAwards) },
    set awards(v: Award[]) { save(KEYS.awards, v) },

    // Notifications
    get notifications(): Notification[] { return load<Notification[]>(KEYS.notifications, defaultNotifications) },
    set notifications(v: Notification[]) { save(KEYS.notifications, v) },

    // Current User
    get currentUser(): User | null { return load<User | null>(KEYS.currentUser, null) },
    set currentUser(v: User | null) { save(KEYS.currentUser, v) },
  }
}
