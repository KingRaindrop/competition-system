import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/common/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/common/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/common/HomeView.vue'),
        },
        {
          path: 'competition/:id',
          name: 'CompetitionDetail',
          component: () => import('@/views/common/CompetitionDetail.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/common/ProfileView.vue'),
        },
        {
          path: 'messages',
          name: 'Messages',
          component: () => import('@/views/common/MessageView.vue'),
        },
        // 学生端
        {
          path: 'student/registrations',
          name: 'MyRegistrations',
          component: () => import('@/views/student/MyRegistrations.vue'),
          meta: { role: 'student' },
        },
        {
          path: 'student/teams',
          name: 'MyTeams',
          component: () => import('@/views/student/MyTeams.vue'),
          meta: { role: 'student' },
        },
        {
          path: 'student/upload/:regId',
          name: 'WorkUpload',
          component: () => import('@/views/student/WorkUpload.vue'),
          meta: { role: 'student' },
        },
        {
          path: 'student/results',
          name: 'MyResults',
          component: () => import('@/views/student/MyResults.vue'),
          meta: { role: 'student' },
        },
        {
          path: 'student/feedback',
          name: 'MyFeedback',
          component: () => import('@/views/student/MyFeedback.vue'),
          meta: { role: 'student' },
        },
        // 教师端
        {
          path: 'teacher/competitions',
          name: 'TeacherCompetitions',
          component: () => import('@/views/teacher/MyCompetitions.vue'),
          meta: { role: 'teacher' },
        },
        {
          path: 'teacher/create',
          name: 'CreateCompetition',
          component: () => import('@/views/teacher/CreateCompetition.vue'),
          meta: { role: 'teacher' },
        },
        {
          path: 'teacher/edit/:id',
          name: 'EditCompetition',
          component: () => import('@/views/teacher/CreateCompetition.vue'),
          meta: { role: 'teacher' },
        },
        {
          path: 'teacher/manage/:id',
          name: 'CompetitionManage',
          component: () => import('@/views/teacher/CompetitionManage.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/reviewer/:id',
          name: 'AssignReviewers',
          component: () => import('@/views/teacher/AssignReviewers.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/rubric/:id',
          name: 'ScoringRubric',
          component: () => import('@/views/teacher/ScoringRubric.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/scores/:id',
          name: 'ScoreSummary',
          component: () => import('@/views/teacher/ScoreSummary.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/finalists/:id',
          name: 'FinalistManage',
          component: () => import('@/views/teacher/FinalistManage.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/publish/:id',
          name: 'PublishResults',
          component: () => import('@/views/teacher/PublishResults.vue'),
          meta: { role: ['teacher', 'admin'] },
        },
        {
          path: 'teacher/judge/:id',
          name: 'JudgeScoring',
          component: () => import('@/views/teacher/JudgeScoring.vue'),
          meta: { role: 'teacher' },
        },
        {
          path: 'teacher/invite-codes',
          name: 'TeacherInviteCodes',
          component: () => import('@/views/admin/InviteCodeManage.vue'),
          meta: { role: 'teacher' },
        },
        {
          path: 'teacher/my-reviews',
          name: 'MyReviewList',
          component: () => import('@/views/teacher/MyReviewList.vue'),
          meta: { role: 'teacher' },
        },
        // 管理员端
        {
          path: 'admin/dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/audit',
          name: 'CompetitionAudit',
          component: () => import('@/views/admin/CompetitionAudit.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/competitions',
          name: 'AllCompetitions',
          component: () => import('@/views/admin/AllCompetitions.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/users',
          name: 'UserManagement',
          component: () => import('@/views/admin/UserManagement.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/settings',
          name: 'SystemSettings',
          component: () => import('@/views/admin/SystemSettings.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/invite-codes',
          name: 'AdminInviteCodes',
          component: () => import('@/views/admin/InviteCodeManage.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'admin/feedback',
          name: 'FeedbackManage',
          component: () => import('@/views/admin/FeedbackManage.vue'),
          meta: { role: 'admin' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // Wait for auth initialization (restore session from token)
  if (!auth.initialized) {
    const token = localStorage.getItem('comp_sys_token')
    if (token) {
      await auth.fetchMe()
    } else {
      auth.setInitialized()
    }
  }

  if (to.meta.guest) {
    next()
    return
  }
  if (!auth.isLoggedIn) {
    next('/login')
    return
  }
  if (to.meta.role) {
    const roles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
    if (!roles.includes(auth.userRole!)) {
      next('/')
      return
    }
  }
  next()
})

export default router
