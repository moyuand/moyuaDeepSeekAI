# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

墨鱼AI智能助手 - 一个基于 Vue 3 + Vite 构建的 AI 聊天应用，使用 Naive UI 组件库和 DeepSeek API。

## 开发命令

```bash
# 安装依赖
npm install

# 开发环境运行（热重载）
npm run dev

# 构建生产环境
npm run build

# 预览生产构建
npm run preview

# 代码检查和自动修复
npm run lint

# 代码格式化
npm run format
```

## 核心架构

### 认证和路由系统

- **登录状态管理**: 通过 localStorage 存储 `userId`、`username` 和 `apiKey`
- **全局认证检查**: 在 `App.vue` 中实现，页面加载时自动验证登录状态
- **路由守卫**: 在 `src/router/index.js` 中配置，包含两层守卫：
  - `beforeEach`: 基本的登录检查和重定向
  - `beforeResolve`: 额外的 API 令牌验证（可扩展）
- **401/403 处理**: 在 `App.vue:109-125` 中拦截全局 fetch 请求，自动处理认证失效

### API 请求架构

- **统一请求封装**: `src/utils/request.js` 使用 axios 实例
- **API 代理配置**: Vite 开发服务器代理 `/api` 到 `http://localhost:8999/api`（见 `vite.config.js:13-19`）
- **错误处理**:
  - 响应拦截器统一处理错误状态码
  - 401/403 自动清除登录信息并跳转登录页
  - 支持自定义错误对象 `isApiError` 标志
- **导出方法**: `get`, `post`, `put`, `patch`, `del`, `upload`

### 主题系统

- **主题模式**: 支持 light/dark/system 三种模式
- **全局管理**: 在 `App.vue` 中通过 provide/inject 模式管理
- **持久化**: 主题设置保存在 localStorage 的 `themeMode` 键中
- **Naive UI 集成**: 使用 `NConfigProvider` 全局配置深色主题

### 状态管理

- **Pinia Stores**: 使用 Composition API 风格定义 stores
- **当前 Store**: `src/stores/counter.js` 是示例 store（可根据需要扩展）

### 页面结构

主要视图文件位于 `src/views/`:

- **HomeView.vue**: 主聊天界面，包含侧边栏历史记录功能
- **LoginView.vue**: 用户登录页面
- **SettingsView.vue**: 应用设置页面
- **HistoryView.vue**: 历史记录详情页面
- **AboutView.vue**: 关于页面
- **NotFoundView.vue**: 404 页面

### 聊天功能架构

HomeView.vue 实现了核心聊天功能：

- **PC端侧边栏**: 响应式设计，桌面端显示历史记录侧边栏
- **历史记录管理**: 支持加载、切换和删除历史对话
- **消息渲染**: 支持 Markdown 格式和代码高亮（使用 marked 和 highlight.js）

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **路由**: Vue Router 4
- **状态管理**: Pinia 3
- **UI 组件库**: Naive UI 2
- **HTTP 客户端**: Axios
- **样式**: TailwindCSS + PostCSS
- **Markdown**: marked + highlight.js

## 关键配置

### 路径别名

在 `vite.config.js` 中配置了路径别名 `@` 指向 `src/` 目录。使用示例：

```javascript
import { get } from '@/utils/request'
import HomeView from '@/views/HomeView.vue'
```

### 开发服务器

- **Host**: `0.0.0.0` - 允许局域网访问
- **代理**: `/api` 路径代理到后端 API 服务器

## 开发注意事项

### 认证流程

1. 用户通过 LoginView 输入凭证
2. 登录成功后存储 `userId`、`username`、`apiKey` 到 localStorage
3. 所有需要认证的路由在 meta 中标记 `requiresAuth: true`
4. 路由守卫自动检查并重定向未登录用户
5. API 请求错误时自动处理认证失效

### 添加新的 API 调用

使用 `src/utils/request.js` 中的封装方法：

```javascript
import { get, post } from '@/utils/request'

// GET 请求
const data = await get('/endpoint', { param1: 'value' })

// POST 请求
const result = await post('/endpoint', { key: 'value' })

// 错误处理
try {
  const data = await get('/endpoint')
} catch (error) {
  if (error.isApiError) {
    // 处理 API 错误
    console.error(error.message)
  }
}
```

### 使用主题功能

在组件中注入主题相关的状态和方法：

```javascript
import { inject } from 'vue'

const themeMode = inject('themeMode')
const theme = inject('theme')
const changeTheme = inject('changeTheme')

// 切换主题
changeTheme('dark') // 'light', 'dark', 'system'
```

### 添加新路由

在 `src/router/index.js` 中添加路由配置，需要认证的路由添加 meta：

```javascript
{
  path: '/new-page',
  name: 'newPage',
  component: () => import('../views/NewPageView.vue'),
  meta: { requiresAuth: true } // 需要登录才能访问
}
```
