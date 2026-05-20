# 学科竞赛报名评审系统

前后端分离的全栈 Web 应用，覆盖竞赛全生命周期：发布审核 → 报名组队 → 作品提交 → 评审评分 → 奖项公布。支持学生、教师、管理员三种角色。

部署教程 =======> https://www.bilibili.com/video/BV1o95R6REvE/?vd_source=7783c5271a035cf5d2cfb4750db985bc

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API)、Vite、TypeScript、Pinia、Vue Router、Element Plus |
| 后端 | Node.js、Express 5、TypeScript |
| 数据库 | SQLite + Prisma ORM |
| 认证 | JWT（jsonwebtoken） |
| 部署 | Docker 多阶段构建 + docker-compose |

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器 (Vue 3 SPA)                     │
│               Hash Router / Pinia Store                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (JSON/Multipart)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Express API Server (:3000)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  JWT 鉴权 │  │  CORS 跨域 │  │   文件上传 (multer)    │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              12 组 REST 路由模块                    │  │
│  │ auth / users / competitions / teams / registrations │  │
│  │ files / reviews / awards / notifications /         │  │
│  │ feedbacks / invite-codes / health                   │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                                │
│                    Prisma Client                         │
│                         │                                │
│                    SQLite (dev.db)                       │
└─────────────────────────────────────────────────────────┘
```

Docker 部署时，Express 同时托管前端静态文件（SPA 回退），单进程对外服务。

## 角色与权限

| 功能 | student | teacher | admin |
|------|:---:|:---:|:---:|
| 浏览竞赛广场 / 查看详情 | ✓ | ✓ | ✓ |
| 报名参赛 / 组队 | ✓ | | |
| 上传作品文件 | ✓ | | |
| 查看个人成绩与获奖 | ✓ | | |
| 提交意见反馈 | ✓ | | |
| 创建竞赛 | | ✓ | |
| 指派评委 / 设置评分标准 | | ✓ (自己的竞赛) | ✓ (所有) |
| 查看评分统计 / 管理入围 | | ✓ (自己的竞赛) | ✓ (所有) |
| 公布结果 | | ✓ (自己的竞赛) | ✓ (所有) |
| 生成邀请码 | | ✓ (仅学生码) | ✓ (教师/学生码) |
| 团队管理 / 解散团队 | | ✓ (自己的竞赛) | ✓ (所有) |
| 审核竞赛 | | | ✓ |
| 用户管理 / 封禁 | | | ✓ |
| 系统设置（校名/学院等） | | | ✓ |
| 反馈回复处理 | | | ✓ |

## 目录结构

```
├── Dockerfile              # 三阶段构建
├── docker-compose.yml      # 单服务 + data/uploads 持久化卷
├── entrypoint.sh           # 启动前 db push + 可选 seed
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # 14 个数据模型定义
│   │   └── seed.ts         # 演示数据
│   └── src/
│       ├── index.ts        # Express 入口，注册路由与中间件
│       ├── config.ts       # 环境变量读取
│       ├── lib/
│       │   ├── jwt.ts      # JWT 签发与验证
│       │   ├── prisma.ts   # PrismaClient 单例
│       │   └── utils.ts    # nowLocal() 等工具函数
│       ├── middleware/
│       │   ├── auth.ts     # JWT 鉴权 + 实时角色查询
│       │   └── upload.ts   # multer 文件上传配置
│       └── routes/         # 每个文件对应一组 REST API
│           ├── auth.ts         # 注册/登录/个人信息
│           ├── users.ts        # 用户 CRUD、封禁、系统配置
│           ├── competitions.ts # 竞赛 CRUD、审核、发布
│           ├── teams.ts        # 组队、成员管理
│           ├── registrations.ts# 报名管理
│           ├── files.ts        # 作品文件上传下载
│           ├── reviews.ts      # 评分标准、评委指派、评分
│           ├── awards.ts       # 奖项设置与分配
│           ├── notifications.ts# 系统通知
│           ├── feedbacks.ts    # 意见反馈
│           └── inviteCodes.ts  # 邀请码生成与验证
├── frontend/
│   └── src/
│       ├── main.ts         # Vue 应用入口
│       ├── App.vue         # 根组件
│       ├── api/
│       │   ├── client.ts   # axios 实例（拦截器注入 token）
│       │   └── index.ts    # 所有 API 方法封装（authApi/userApi/...）
│       ├── router/
│       │   └── index.ts    # 路由表 + beforeEach 鉴权守卫
│       ├── stores/         # Pinia 状态管理
│       │   ├── auth.ts         # 用户登录态
│       │   ├── competition.ts  # 竞赛列表/缓存
│       │   ├── team.ts         # 团队状态
│       │   ├── registration.ts # 报名状态
│       │   ├── review.ts       # 评分/奖项状态
│       │   ├── notification.ts # 通知状态
│       │   ├── inviteCode.ts   # 邀请码状态
│       │   └── feedback.ts     # 反馈状态
│       ├── types/
│       │   └── index.ts    # 全局 TypeScript 接口
│       ├── utils/
│       │   └── format.ts   # 日期格式化等工具
│       ├── components/
│       │   ├── common/     # CompetitionCard / FileUploader / ScoringForm / StatusTag / TimelineBar
│       │   └── layout/     # AppLayout + 三套侧边栏（Admin / Teacher / Student）
│       └── views/
│           ├── common/     # 公共页面：竞赛广场、详情、登录、注册、个人中心、消息
│           ├── student/    # 我的报名、我的团队、作品上传、我的成绩、意见反馈
│           ├── teacher/    # 我的竞赛、创建竞赛、竞赛管理、指派评委、评分表、评分统计、入围管理、公布结果、评委打分、邀请码
│           └── admin/      # 仪表盘、竞赛审核、全部竞赛、用户管理、系统设置、邀请码、反馈管理
```

## 数据模型

共 14 个模型，关系如下：

```
User ──1:N──→ Competition (creatorId)      竞赛创建者
User ──1:N──→ Team (captainId)             队长
User ──1:N──→ TeamMember (studentId)       队员
User ──1:N──→ Registration (studentId)     报名学生
User ──1:N──→ Registration (advisorId)     指导教师
User ──1:N──→ ReviewerAssignment (teacherId) 评委指派
User ──1:N──→ Review (reviewerId)          评分记录
User ──1:N──→ Notification                消息通知
User ──1:N──→ Feedback                    意见反馈
User ──1:N──→ InviteCode                  邀请码

Competition ──1:N──→ Registration         竞赛报名
Competition ──1:N──→ ScoringRubric         评分标准
Competition ──1:N──→ ReviewerAssignment    评委指派
Competition ──1:N──→ Award                 奖项设置

Team ──1:N──→ TeamMember                  团队成员
Team ──1:N──→ Registration                团队报名

Registration ──1:N──→ WorkFile            作品文件
Registration ──1:N──→ Review              评审记录
Registration ──1:N──→ Award               获奖记录

Review ──1:N──→ ReviewDetail              评分明细
ScoringRubric ──1:N──→ ReviewDetail       评分项
```

### 竞赛状态机

```
draft → pending → published → registering → reviewing → final → ended
                        ↑              ↓           ↓
                        └──←──←──←───  ←──←───     ←──
                      (可在 published/registering 间循环)
                 任意状态 → cancelled（取消）
```

竞赛状态由后端在请求时按时间自动推进，无需手动切换。

## API 设计

所有 API 前缀 `/api`，JSON 格式。auth 标记表示需携带 `Authorization: Bearer <token>` 请求头。

### Auth (`/api/auth`)
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|:--:|
| POST | `/register` | 注册（需邀请码） | |
| POST | `/login` | 登录 | |
| GET | `/me` | 获取当前用户 | auth |
| PUT | `/profile` | 修改个人资料 | auth |

### Users (`/api/users`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|:--:|
| GET | `/` | 所有用户列表 | admin |
| GET | `/teachers` | 教师列表 | auth |
| POST | `/` | 管理员手动创建用户 | admin |
| PUT | `/:id` | 修改用户 | admin |
| PATCH | `/:id/status` | 启停用户 | admin |
| PATCH | `/:id/ban` | 禁止参赛 | admin |
| PATCH | `/:id/unban` | 解除禁赛 | admin |
| GET | `/system/config` | 获取系统配置 | 公开 |
| PUT | `/system/config` | 修改系统配置 | admin |

### Competitions (`/api/competitions`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|:--:|
| GET | `/` | 全部竞赛（支持筛选） | admin/teacher |
| GET | `/published` | 已发布竞赛（广场） | 公开 |
| GET | `/:id` | 竞赛详情 | 公开 |
| POST | `/` | 创建竞赛 | teacher/admin |
| PUT | `/:id` | 编辑竞赛 | 创建者/admin |
| PATCH | `/:id/submit` | 提交审核 | 创建者 |
| PATCH | `/:id/approve` | 审核通过 | admin |
| PATCH | `/:id/reject` | 审核驳回 | admin |
| PATCH | `/:id/cancel` | 取消竞赛 | 创建者/admin |
| DELETE | `/:id` | 删除竞赛 | admin |

### Teams (`/api/teams`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/mine` | 我的团队 |
| GET | `/:id` | 团队详情 |
| POST | `/` | 创建团队 |
| POST | `/:id/members` | 邀请队员 |
| PATCH | `/:id/members/:memberId` | 处理邀请状态 |
| DELETE | `/:id/members/:memberId` | 移除队员 |
| DELETE | `/:id` | 解散团队 |
| GET | `/by-competition/:competitionId` | 竞赛下所有团队 |

### Reviews (`/api/reviews`) — 评审核心
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/rubrics/:competitionId` | 获取评分标准 |
| PUT | `/rubrics/:competitionId` | 保存评分标准 |
| GET | `/reviewers/:competitionId` | 获取评委名单 |
| PUT | `/reviewers/:competitionId` | 指派评委 |
| GET | `/my-assignments` | 我的评审任务 |
| GET | `/scores/:registrationId` | 获取某报名的所有评分 |
| POST | `/scores` | 提交评分 |
| GET | `/average/:registrationId` | 平均分 |
| GET | `/progress/:competitionId` | 评审进度 |

### Awards (`/api/awards`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/:competitionId` | 获取奖项列表 |
| PUT | `/:competitionId` | 批量保存奖项 |
| PATCH | `/:awardId/assign` | 分配获奖作品 |
| GET | `/competition/:id/results` | 公开结果 |

### 其他路由
- **Registrations** (`/api/registrations`) — 报名 CRUD、状态管理、入围设置
- **Files** (`/api/files`) — 作品上传(多文件)、下载、删除
- **Notifications** (`/api/notifications`) — 消息列表、已读标记
- **Feedbacks** (`/api/feedbacks`) — 学生创建、管理员回复
- **Invite Codes** (`/api/invite-codes`) — 生成、验证、删除

## 前端架构

### 路由设计

使用 Hash 路由（兼容 Docker 直接托管），`beforeEach` 守卫实现三层鉴权：

1. **未登录** → 重定向到 `/login`
2. **角色不匹配** → 重定向到首页 `/`
3. **路由懒加载** → 首屏体积最小化

```typescript
// 角色元数据支持单值和数组
meta: { role: 'admin' }           // 单角色
meta: { role: ['teacher', 'admin'] } // 多角色
```

### 状态管理 (Pinia)

每个 Store 采用 Composition API 风格，统一模式：

```
Store = ref(state) + async function actions + computed getters
```

- `authStore` — 登录态、currentUser、fetchMe
- `competitionStore` — 竞赛缓存、getPublished/getById、refreshStatuses
- `reviewStore` — 评分标准/结果/奖项、平均分缓存
- `teamStore` / `registrationStore` / `notificationStore` / `inviteCodeStore` / `feedbackStore`

### API 层

`api/client.ts` 导出 axios 实例，自动注入 `Authorization` 头。`api/index.ts` 按业务模块分 10 组导出（authApi、userApi、competitionApi、teamApi...），各组纯函数返回 Promise。

### 组件分层

```
components/common/   → 可复用组件（CompetitionCard / FileUploader / ScoringForm / StatusTag / TimelineBar）
components/layout/   → AppLayout + 三套侧边栏（角色决定菜单项）
views/common/        → 三种角色共享的页面
views/{role}/        → 角色专属页面
```

## 认证流程

```
JWT payload: { userId, role }

中间件 auth():
  1. 从 Authorization 头提取 Bearer token
  2. 验证 JWT 签名与过期
  3. 从数据库查询用户当前角色（覆盖 JWT 中的 role）
     → 管理员提权后无需重新登录，刷新页面即生效
  4. 检查用户未被封禁(status=1, banned=false)
  5. 将 user 信息注入 req.user
```

## Docker 部署

### 三阶段构建

```
Stage 1 (frontend-builder): npm install → npm run build → 产出 dist/
Stage 2 (backend-builder):  npm install → prisma generate → tsc → 产出 dist/
Stage 3 (runtime):         只装生产依赖 → 复制前后端产物 → 启动
```

最终镜像 ~200MB，运行在 Node 22 Alpine。

### docker-compose 部署

```bash
# 设置环境变量后
docker compose up -d --build

# 首次启动如需种子数据
RUN_SEED=true docker compose up -d
```

两个持久化卷：
- `data` → SQLite 数据库文件（`/app/prisma/dev.db`）
- `uploads` → 上传的作品文件（`/app/uploads/`）

### 启动流程 (entrypoint.sh)

```bash
1. 将备份 schema 复制到 Prisma 工作目录（防止 volume 覆盖）
2. npx prisma db push --skip-generate（同步模型到数据库）
3. 可选：npx tsx prisma/seed.ts（RUN_SEED=true 时）
4. node dist/index.js（启动服务）
```

## 业务核心流程

### 竞赛报名参赛流程

```
教师创建竞赛(draft) → 提交审核(pending) → 管理员审核通过(published)
    → 报名期(registering) → 学生报名/组队 → 作品提交
    → 评审期(reviewing) → 评委评分 → 评分统计 → 入围管理
    → 终审期(final) → 公布结果(ended)
```

### 注册流程

```
学生访问注册页 → 选择学院 → 输入邀请码 → 验证通过 → 填写信息 → 注册成功
                                                          ↓
                                              角色由邀请码决定(student/teacher)
                                              管理员可通过邀请码创建教师账号
```

## 安全设计

- JWT 过期后自动跳转登录页
- 文件下载验证报名关系/团队成员/竞赛创建者权限
- 邀请码控制注册入口（按学院限制、次数上限、过期时间）
- 被封禁用户登录返回 403、报名返回 403
- 密码 bcrypt 加盐哈希
- 生产环境必须设置强随机 `JWT_SECRET`
