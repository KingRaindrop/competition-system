import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function d(offsetDays: number, hour = 0, minute = 0): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  dt.setHours(hour, minute, 0, 0)
  return dt.toISOString()
}

async function main() {
  console.log('Seeding database...')

  // Users
  await prisma.user.createMany({
    data: [
      { userId: 'admin', name: '系统管理员', role: 'admin', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '教务处', email: 'admin@jyu.edu.cn', status: 1 },
      { userId: 'T2021001', name: '张教授', role: 'teacher', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '计算机学院', major: '计算机科学与技术', email: 'zhang@jyu.edu.cn', phone: '13800001111', status: 1 },
      { userId: 'T2021002', name: '李教授', role: 'teacher', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '计算机学院', major: '软件工程', email: 'li@jyu.edu.cn', phone: '13800002222', status: 1 },
      { userId: 'T2021003', name: '王教授', role: 'teacher', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '电子信息工程学院', major: '电子信息工程', email: 'wang@jyu.edu.cn', status: 1 },
      { userId: 'S2024001', name: '张三', role: 'student', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '计算机学院', major: '计算机科学与技术', grade: '2024级', email: 'zhangsan@stu.jyu.edu.cn', status: 1 },
      { userId: 'S2024002', name: '李四', role: 'student', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '计算机学院', major: '软件工程', grade: '2024级', email: 'lisi@stu.jyu.edu.cn', status: 1 },
      { userId: 'S2024003', name: '王五', role: 'student', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '电子信息工程学院', major: '电子信息工程', grade: '2024级', status: 1 },
      { userId: 'S2024004', name: '赵六', role: 'student', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '计算机学院', major: '网络工程', grade: '2024级', status: 1 },
      { userId: 'S2023001', name: '孙七', role: 'student', password: '$2a$10$BKDDMWy7YTglatRusk9QI.iGHCurIuRRpS79qaYnjdbpdyz5Tqpsu', college: '数学学院', major: '数学与应用数学', grade: '2023级', status: 1 },
    ],
  })

  // Competitions
  await prisma.competition.createMany({
    data: [
      {
        competitionId: 'comp001', title: '2026年大学生计算机设计大赛校内选拔赛', organizer: '计算机学院',
        category: '理工类', description: '选拔优秀作品参加省级大学生计算机设计大赛，涵盖软件应用开发、人工智能应用、数字媒体设计等方向。',
        detail: '<h3>比赛背景</h3><p>大学生计算机设计大赛是面向全国高校学生的重要学科竞赛。</p>',
        creatorId: 'T2021001', status: 'registering',
        regStart: d(-5, 8, 0), regEnd: d(10, 23, 59), submitStart: d(11, 8, 0), submitEnd: d(20, 23, 59),
        reviewStart: d(21, 8, 0), reviewEnd: d(28, 23, 59), finalTime: d(35, 14, 0), finalLocation: '田家炳教学楼 301 会议室',
        resultTime: d(38, 10, 0), allowFormats: 'zip,rar,pdf,ppt,pptx,mp4,jpg,png', maxFileSize: 100,
        allowIndividual: false, teamMin: 2, teamMax: 5, requireAdvisor: true, reviewMode: 'open',
        createdAt: d(-10, 0, 0), updatedAt: d(-10, 0, 0),
      },
      {
        competitionId: 'comp002', title: '创新创业项目路演大赛', organizer: '创新创业学院',
        category: '创新创业类', description: '面向全校学生的创新创业项目路演比赛，展示创新思维与商业策划能力。',
        creatorId: 'T2021002', status: 'pending',
        regStart: d(20, 8, 0), regEnd: d(35, 23, 59), submitStart: d(36, 8, 0), submitEnd: d(45, 23, 59),
        reviewStart: d(46, 8, 0), reviewEnd: d(50, 23, 59), finalTime: d(58, 14, 0), finalLocation: '文科楼 101 报告厅',
        resultTime: d(60, 10, 0), allowFormats: 'pdf,ppt,pptx,doc,docx', maxFileSize: 50,
        allowIndividual: true, teamMin: 1, teamMax: 4, requireAdvisor: false, reviewMode: 'blind',
        createdAt: d(-3, 0, 0), updatedAt: d(-3, 0, 0),
      },
      {
        competitionId: 'comp003', title: '数学建模竞赛校内选拔赛', organizer: '数学学院',
        category: '理工类', description: '面向全校的数学建模竞赛，选拔队伍参加全国大学生数学建模竞赛。',
        creatorId: 'T2021001', status: 'reviewing',
        regStart: d(-30, 8, 0), regEnd: d(-20, 23, 59), submitStart: d(-19, 8, 0), submitEnd: d(-10, 23, 59),
        reviewStart: d(-9, 8, 0), reviewEnd: d(2, 23, 59), finalTime: d(8, 14, 0), finalLocation: '田家炳教学楼 201 教室',
        resultTime: d(10, 10, 0), allowFormats: 'pdf,doc,docx,zip', maxFileSize: 30,
        allowIndividual: false, teamMin: 3, teamMax: 3, requireAdvisor: true, reviewMode: 'blind',
        createdAt: d(-35, 0, 0), updatedAt: d(-35, 0, 0),
      },
      {
        competitionId: 'comp004', title: '程序设计竞赛（ACM校赛）', organizer: '计算机学院',
        category: '理工类', description: 'ACM/ICPC 风格的团队编程竞赛，考察算法与数据结构能力。',
        creatorId: 'T2021002', status: 'draft',
        regStart: d(15, 8, 0), regEnd: d(30, 23, 59), submitStart: d(15, 8, 0), submitEnd: d(30, 23, 59),
        reviewStart: d(31, 8, 0), reviewEnd: d(32, 23, 59), finalTime: d(33, 9, 0), finalLocation: '锡昌科技楼 501 机房',
        resultTime: d(33, 18, 0), allowFormats: 'zip,pdf', maxFileSize: 20,
        allowIndividual: false, teamMin: 3, teamMax: 3, requireAdvisor: false, reviewMode: 'open',
        createdAt: d(-2, 0, 0), updatedAt: d(-2, 0, 0),
      },
      {
        competitionId: 'comp005', title: '英语演讲比赛', organizer: '外国语学院',
        category: '人文社科类', description: '全校英语演讲比赛，展示英语表达与演讲风采。',
        creatorId: 'T2021003', status: 'ended',
        regStart: d(-50, 8, 0), regEnd: d(-40, 23, 59), submitStart: d(-39, 8, 0), submitEnd: d(-30, 23, 59),
        reviewStart: d(-29, 8, 0), reviewEnd: d(-22, 23, 59), finalTime: d(-15, 14, 0), finalLocation: '金利来学术报告厅',
        resultTime: d(-12, 10, 0), allowFormats: 'mp4,ppt,pptx', maxFileSize: 200,
        allowIndividual: true, teamMin: 1, teamMax: 1, requireAdvisor: false, reviewMode: 'blind',
        createdAt: d(-55, 0, 0), updatedAt: d(-55, 0, 0),
      },
    ],
  })

  // Teams
  await prisma.team.createMany({
    data: [
      { teamId: 'team001', name: '码农突击队', captainId: 'S2024001' },
      { teamId: 'team002', name: '数学建模必胜队', captainId: 'S2023001' },
    ],
  })

  // Team members
  await prisma.teamMember.createMany({
    data: [
      { id: 'tm001', teamId: 'team001', studentId: 'S2024001', role: 'captain', status: 'accepted' },
      { id: 'tm002', teamId: 'team001', studentId: 'S2024002', role: 'member', status: 'accepted' },
      { id: 'tm003', teamId: 'team001', studentId: 'S2024004', role: 'member', status: 'invited' },
      { id: 'tm004', teamId: 'team002', studentId: 'S2023001', role: 'captain', status: 'accepted' },
    ],
  })

  // Registrations
  await prisma.registration.createMany({
    data: [
      { registrationId: 'reg001', competitionId: 'comp001', teamId: 'team001', workTitle: '智慧校园服务平台', advisorId: 'T2021001', status: 'registered', createdAt: d(-3, 14, 0) },
      { registrationId: 'reg002', competitionId: 'comp003', teamId: 'team002', workTitle: '基于神经网络的股票预测模型', advisorId: 'T2021001', status: 'submitted', createdAt: d(-22, 9, 0) },
      { registrationId: 'reg003', competitionId: 'comp005', studentId: 'S2024003', workTitle: 'The Future of AI', advisorId: 'T2021003', status: 'submitted', createdAt: d(-45, 11, 0) },
    ],
  })

  // Rubrics
  await prisma.scoringRubric.createMany({
    data: [
      { rubricId: 'rub001', competitionId: 'comp003', name: '模型建立', maxScore: 30, weight: 0.3, sortOrder: 1 },
      { rubricId: 'rub002', competitionId: 'comp003', name: '求解方法', maxScore: 30, weight: 0.3, sortOrder: 2 },
      { rubricId: 'rub003', competitionId: 'comp003', name: '论文写作', maxScore: 20, weight: 0.2, sortOrder: 3 },
      { rubricId: 'rub004', competitionId: 'comp003', name: '创新性', maxScore: 20, weight: 0.2, sortOrder: 4 },
      { rubricId: 'rub005', competitionId: 'comp005', name: '演讲内容', maxScore: 40, weight: 0.4, sortOrder: 1 },
      { rubricId: 'rub006', competitionId: 'comp005', name: '语言表达', maxScore: 30, weight: 0.3, sortOrder: 2 },
      { rubricId: 'rub007', competitionId: 'comp005', name: '台风表现', maxScore: 30, weight: 0.3, sortOrder: 3 },
    ],
  })

  // Reviewer assignments
  await prisma.reviewerAssignment.createMany({
    data: [
      { id: 'ra001', competitionId: 'comp003', teacherId: 'T2021001', assignedAt: d(-12, 9, 0) },
      { id: 'ra002', competitionId: 'comp003', teacherId: 'T2021002', assignedAt: d(-12, 9, 0) },
      { id: 'ra003', competitionId: 'comp003', teacherId: 'T2021003', assignedAt: d(-12, 9, 0) },
    ],
  })

  // Reviews
  await prisma.review.createMany({
    data: [
      { reviewId: 'rev001', registrationId: 'reg002', reviewerId: 'T2021002', totalScore: 85, comment: '模型设计合理，论证充分，建议进入决赛。', status: 'submitted', submittedAt: d(-8, 10, 0) },
      { reviewId: 'rev002', registrationId: 'reg002', reviewerId: 'T2021003', totalScore: 78, comment: '整体不错，创新性可进一步加强。', status: 'submitted', submittedAt: d(-7, 14, 0) },
    ],
  })

  // Review details
  await prisma.reviewDetail.createMany({
    data: [
      { id: 'rd001', reviewId: 'rev001', rubricId: 'rub001', score: 26 },
      { id: 'rd002', reviewId: 'rev001', rubricId: 'rub002', score: 25 },
      { id: 'rd003', reviewId: 'rev001', rubricId: 'rub003', score: 17 },
      { id: 'rd004', reviewId: 'rev001', rubricId: 'rub004', score: 17 },
      { id: 'rd005', reviewId: 'rev002', rubricId: 'rub001', score: 23 },
      { id: 'rd006', reviewId: 'rev002', rubricId: 'rub002', score: 24 },
      { id: 'rd007', reviewId: 'rev002', rubricId: 'rub003', score: 16 },
      { id: 'rd008', reviewId: 'rev002', rubricId: 'rub004', score: 15 },
    ],
  })

  // Awards
  await prisma.award.createMany({
    data: [
      { awardId: 'aw001', competitionId: 'comp005', name: '一等奖', quota: 1, registrationId: 'reg003' },
      { awardId: 'aw002', competitionId: 'comp005', name: '二等奖', quota: 2, registrationId: null },
      { awardId: 'aw003', competitionId: 'comp005', name: '三等奖', quota: 3, registrationId: null },
    ],
  })

  // Notifications
  await prisma.notification.createMany({
    data: [
      { notificationId: 'n001', userId: 'S2024001', title: '报名成功', content: '你已成功报名"大学生计算机设计大赛校内选拔赛"，请按时提交作品。', read: false, createdAt: d(-3, 14, 10) },
      { notificationId: 'n002', userId: 'S2024001', title: '团队邀请', content: '你已被邀请加入"码农突击队"团队。', read: true, createdAt: d(-3, 10, 0) },
      { notificationId: 'n003', userId: 'T2021001', title: '竞赛审核通知', content: '你创建的"大学生计算机设计大赛校内选拔赛"已通过审核，现已发布。', read: false, createdAt: d(-6, 9, 0) },
      { notificationId: 'n004', userId: 'T2021002', title: '评审邀请', content: '你已被指派为"数学建模竞赛校内选拔赛"评委，请按时完成评审。', read: false, createdAt: d(-12, 9, 0) },
    ],
  })

  // System config
  await prisma.systemConfig.create({
    data: {
      id: 'main',
      schoolName: 'XX大学',
      colleges: JSON.stringify([
        '数学学院', '物理与电子工程学院', '化学与环境学院',
        '文学院客家学院', '外国语学院', '生命科学学院', '政法学院',
        '地理科学与旅游学院', '经济与管理学院', '计算机学院',
        '林风眠美术学院', '体育学院', '音乐与舞蹈学院',
        '教育科学学院', '土木工程学院', '马克思主义学院',
        '足球(产业)学院', '创新创业学院', '继续教育学院',
        '嘉应学院梅州师范分院', '嘉应学院医学院',
      ]),
      categories: JSON.stringify([
        '理工类', '人文社科类', '经管类', '艺术体育类', '创新创业类', '综合类',
      ]),
    },
  })

  console.log('Seeding complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
