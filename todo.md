# Booxin 手机版 - 功能清单

## 核心功能

### 认证系统
- [x] 注册界面（用户名、密码、确认密码）
- [x] 登录界面（用户名、密码）
- [x] API 层：POST /api/auth/register
- [x] API 层：POST /api/auth/login
- [x] Token 存储到 SecureStore
- [x] 自动登录后跳转到首页
- [x] 错误提示处理（400/401）

### 首页 - 公共房间列表
- [x] 房间卡片组件（显示房间信息）
- [x] API 层：GET /api/rooms?isPublic=true
- [x] 房间列表页面
- [x] 下拉刷新功能
- [x] 自动定时刷新（30 秒）
- [x] 空状态提示

### 好友系统
- [x] 好友列表标签页
- [x] 好友申请标签页
- [x] 房间邀请标签页
- [x] API 层：GET /api/friends
- [x] API 层：POST /api/friends/request（发送好友申请）
- [x] API 层：POST /api/friends/requests/{requestId}/accept（同意申请）
- [x] API 层：POST /api/friends/requests/{requestId}/reject（拒绝申请）
- [x] API 层：DELETE /api/friends/{friendUserId}（删除好友）
- [x] API 层：POST /api/friends/invites/{inviteId}/dismiss（处理邀请）
- [x] 好友申请/邀请的接受/拒绝/忽略功能

### 用户大厅
- [x] 用户列表页面
- [x] API 层：GET /api/auth/users/lobby（获取用户列表）
- [x] 用户卡片组件
- [x] 加好友按钮
- [x] 分页功能
- [x] 搜索功能（可选）
- [x] 在线筛选（可选）

### 我的账户
- [x] 账户信息页面
- [x] API 层：GET /api/auth/me
- [x] API 层：POST /api/auth/change-password
- [x] 修改密码表单
- [x] 通知设置页面
- [x] 登出功能

### 通知系统
- [x] 通知设置（弹窗/后台/关闭）
- [x] 通知设置本地存储
- [x] 房间邀请通知处理
- [x] 前台弹窗通知
- [x] 后台系统通知（expo-notifications）
- [x] 通知点击处理

## 基础设施

### API 层
- [x] API 基础配置（BASE_URL、认证头）
- [x] 请求/响应拦截器
- [x] Token 自动注入
- [x] 错误处理

### 状态管理
- [x] 认证上下文（AuthContext）
- [x] 用户信息存储
- [x] 好友数据缓存
- [x] 通知设置存储

### 路由
- [x] 认证栈（Auth Stack）
- [x] 应用栈（App Stack）
- [x] 标签栏导航
- [ ] 深链接处理

### 样式与主题
- [x] 主题配置（颜色、字体）
- [x] 全局样式
- [x] 响应式布局

## UI 组件

- [ ] 按钮组件
- [ ] 输入框组件
- [ ] 卡片组件
- [ ] 列表项组件
- [ ] 加载状态指示器
- [ ] 错误提示组件
- [ ] 空状态组件
- [ ] 模态对话框（通知）

## 测试与优化

- [ ] 端到端流程测试
- [ ] API 集成测试
- [ ] 错误场景测试
- [ ] 性能优化
- [ ] 内存泄漏检查

## 构建与发布

- [ ] 生成应用图标
- [ ] 配置 app.config.ts
- [ ] 构建 APK
- [ ] 测试 APK 在真机上的表现
