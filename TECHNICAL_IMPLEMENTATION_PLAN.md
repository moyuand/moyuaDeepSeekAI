# 墨鱼AI智能助手 - 技术实施计划

> **版本**: v1.0.0
> **最后更新**: 2025-01
> **依据文档**: CONSTITUTION.md, PROJECT_SPECIFICATION.md

---

## 目录

- [1. 技术栈选型](#1-技术栈选型)
- [2. 整体架构设计](#2-整体架构设计)
- [3. 数据模型定义](#3-数据模型定义)
- [4. 接口层设计](#4-接口层设计)
- [5. 状态管理方案](#5-状态管理方案)
- [6. 错误处理机制](#6-错误处理机制)
- [7. 日志系统](#7-日志系统)
- [8. 测试策略](#8-测试策略)
- [9. 性能优化策略](#9-性能优化策略)
- [10. 开发规范与质量保证](#10-开发规范与质量保证)
- [11. 部署方案](#11-部署方案)
- [12. 实施时间表](#12-实施时间表)

---

## 1. 技术栈选型

### 1.1 核心技术栈

| 技术领域 | 选型 | 版本 | 选型理由 |
|---------|------|-----|----------|
| **框架** | Vue 3 | 3.5+ | Composition API、更好的 TypeScript 支持、性能优异 |
| **构建工具** | Vite | 6.x | 极速 HMR、原生 ESM、开箱即用的优化 |
| **状态管理** | Pinia | 3.x | Vue 官方推荐、Composition API 友好、TypeScript 支持好 |
| **路由** | Vue Router | 4.x | Vue 官方路由、支持代码分割 |
| **UI 框架** | Naive UI | 2.41+ | Vue 3 专用、组件丰富、主题系统完善 |
| **样式方案** | TailwindCSS | 3.4+ | 工具类优先、高度可定制、生产构建小 |
| **HTTP 客户端** | Axios | 1.8+ | 拦截器支持、请求取消、成熟稳定 |
| **Markdown** | marked | 15.x | 轻量、可扩展、支持 GFM |
| **代码高亮** | highlight.js | 11.x | 语言支持丰富、主题多样 |
| **XSS 防护** | DOMPurify | 3.x | 行业标准、配置灵活 |
| **虚拟滚动** | Virtua | 0.46+ | 高性能、React/Vue 通用 |

### 1.2 开发工具

| 工具类型 | 选型 | 用途 |
|---------|------|------|
| **代码检查** | ESLint | 代码质量检查 |
| **代码格式化** | Prettier | 统一代码风格 |
| **Git Hooks** | Husky | 提交前自动检查 |
| **Commit 规范** | Commitlint | 提交信息规范 |
| **单元测试** | Vitest | Vue 3 专用测试框架 |
| **组件测试** | @vue/test-utils | Vue 组件测试 |
| **E2E 测试** | Playwright | 跨浏览器端到端测试 |
| **性能监控** | Lighthouse CI | 自动化性能检查 |
| **包分析** | rollup-plugin-visualizer | Bundle 大小分析 |

### 1.3 技术栈对齐宪法要求

**代码质量要求对齐**:
- ✅ ESLint + Prettier 强制执行（CONSTITUTION.md 第一章）
- ✅ Vue 3 Composition API 最佳实践
- ✅ TypeScript 类型检查（可选，渐进式引入）

**性能要求对齐**:
- ✅ Vite 满足首屏加载 < 2s（CONSTITUTION.md 第四章）
- ✅ TailwindCSS Purge 减小 CSS 体积
- ✅ 虚拟滚动优化长列表性能

**UX 一致性对齐**:
- ✅ Naive UI 统一组件风格（CONSTITUTION.md 第三章）
- ✅ TailwindCSS 响应式断点一致

---

## 2. 整体架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │  展示层
│         (Views + Components)            │
├─────────────────────────────────────────┤
│          State Management Layer         │  状态管理层
│              (Pinia Stores)             │
├─────────────────────────────────────────┤
│            Business Logic Layer         │  业务逻辑层
│           (Composables + Utils)         │
├─────────────────────────────────────────┤
│             Data Access Layer           │  数据访问层
│              (API Services)             │
├─────────────────────────────────────────┤
│           Infrastructure Layer          │  基础设施层
│     (Axios Instance, Interceptors)      │
└─────────────────────────────────────────┘
```

### 2.2 模块划分

#### 2.2.1 核心模块

```
src/
├── modules/
│   ├── auth/                    # 认证模块
│   │   ├── api/                # API 接口
│   │   │   └── authApi.js
│   │   ├── composables/        # 组合式函数
│   │   │   └── useAuth.js
│   │   ├── stores/             # 状态管理
│   │   │   └── authStore.js
│   │   ├── types/              # 类型定义
│   │   │   └── auth.d.ts
│   │   └── views/              # 页面组件
│   │       └── LoginView.vue
│   │
│   ├── chat/                    # 聊天模块
│   │   ├── api/
│   │   │   ├── chatApi.js
│   │   │   └── sseClient.js
│   │   ├── components/
│   │   │   ├── ChatHeader.vue
│   │   │   ├── ChatInput.vue
│   │   │   ├── MessageList.vue
│   │   │   └── MessageItem.vue
│   │   ├── composables/
│   │   │   ├── useChat.js
│   │   │   ├── useTypingEffect.js
│   │   │   └── useSSE.js
│   │   ├── stores/
│   │   │   └── chatStore.js
│   │   ├── types/
│   │   │   └── message.d.ts
│   │   └── views/
│   │       └── HomeView.vue
│   │
│   ├── history/                 # 历史记录模块
│   │   ├── api/
│   │   │   └── historyApi.js
│   │   ├── components/
│   │   │   ├── HistorySidebar.vue
│   │   │   └── HistoryItem.vue
│   │   ├── composables/
│   │   │   └── useHistory.js
│   │   └── stores/
│   │       └── historyStore.js
│   │
│   ├── settings/                # 设置模块
│   │   ├── api/
│   │   │   └── settingsApi.js
│   │   ├── stores/
│   │   │   └── settingsStore.js
│   │   └── views/
│   │       └── SettingsView.vue
│   │
│   └── theme/                   # 主题模块
│       ├── composables/
│       │   └── useTheme.js
│       └── stores/
│           └── themeStore.js
│
├── core/                        # 核心基础设施
│   ├── api/
│   │   ├── request.js          # Axios 实例
│   │   ├── interceptors.js     # 拦截器
│   │   └── endpoints.js        # API 端点配置
│   ├── errors/
│   │   ├── errorHandler.js     # 全局错误处理
│   │   └── errorCodes.js       # 错误码映射
│   ├── logger/
│   │   └── logger.js           # 日志系统
│   └── utils/
│       ├── markdown.js         # Markdown 渲染
│       ├── security.js         # 安全工具
│       └── validation.js       # 数据验证
│
├── shared/                      # 共享资源
│   ├── components/             # 通用组件
│   ├── composables/            # 通用组合式函数
│   ├── constants/              # 常量定义
│   └── types/                  # 全局类型
│
├── router/                      # 路由配置
│   ├── index.js
│   ├── guards.js               # 路由守卫
│   └── routes.js               # 路由定义
│
├── App.vue                      # 根组件
└── main.js                      # 入口文件
```

#### 2.2.2 模块职责

**认证模块 (auth)**:
- 用户登录、注册、登出
- Token 管理
- 权限验证

**聊天模块 (chat)**:
- 消息发送与接收
- SSE 流式响应处理
- 打字效果
- Markdown 渲染

**历史记录模块 (history)**:
- 历史对话列表
- 对话加载与删除
- 历史搜索（计划中）

**设置模块 (settings)**:
- 用户资料管理
- 安全设置（密码、API Key）
- 外观设置（主题、语言、打字速度）

**主题模块 (theme)**:
- 主题模式管理（light / dark / system）
- 主题切换
- 持久化

### 2.3 数据流架构

```
┌──────────┐
│   View   │ ─── 触发 Action ───▶ ┌───────────┐
└──────────┘                      │   Store   │
     ▲                            └─────┬─────┘
     │                                  │
     │                                  ▼
     │                            ┌──────────┐
     └──── 响应式更新 ◀──────────── │   API    │
                                  └─────┬────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │ Backend  │
                                  └──────────┘
```

**数据流向**:
1. **用户交互** → 触发 View 中的事件
2. **View** → 调用 Composable 或 Store Action
3. **Store Action** → 调用 API Service
4. **API Service** → 发送 HTTP/SSE 请求到后端
5. **后端响应** → 返回数据
6. **API Service** → 处理响应、错误
7. **Store** → 更新状态
8. **View** → 响应式更新 UI

---

## 3. 数据模型定义

### 3.1 用户模型 (User)

```typescript
/**
 * 用户信息
 */
interface User {
  id: string;                    // 用户ID
  username: string;              // 用户名
  email?: string;                // 邮箱（可选）
  apiKey: string;                // API密钥
  createdAt?: string;            // 创建时间（ISO 8601）
  updatedAt?: string;            // 更新时间（ISO 8601）
}

/**
 * 登录请求
 */
interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
interface LoginResponse {
  id: string;
  username: string;
  api_key: string;
}

/**
 * 注册请求
 */
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * 注册响应
 */
interface RegisterResponse {
  id: string;
  username: string;
  api_key: string;
}
```

### 3.2 消息模型 (Message)

```typescript
/**
 * 消息角色
 */
type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息对象
 */
interface Message {
  id?: string;                   // 消息ID（可选，客户端生成）
  role: MessageRole;             // 角色
  content: string;               // 消息内容
  reasoning?: string;            // 推理过程（仅 assistant）
  timestamp?: number;            // 时间戳
  isGenerating?: boolean;        // 是否正在生成中
}

/**
 * 对话任务
 */
interface ConversationTask {
  taskId: string;                // 任务ID
  userId: string;                // 用户ID
  messages: Message[];           // 消息列表
  firstMessage: string;          // 第一条消息（用作标题）
  startTime: string;             // 开始时间（ISO 8601）
  lastActivity?: string;         // 最后活动时间
}

/**
 * 发送消息请求
 */
interface SendMessageRequest {
  content: string;               // 消息内容
  userId: string;                // 用户ID
  taskId?: string;               // 任务ID（续对话时）
}

/**
 * 发送消息响应
 */
interface SendMessageResponse {
  taskId: string;                // 任务ID
  success?: boolean;             // 是否成功
}
```

### 3.3 SSE 事件模型

```typescript
/**
 * SSE 事件类型
 */
type SSEEventType = 'reasoning' | 'content' | 'done' | 'error';

/**
 * SSE 事件数据
 */
interface SSEEvent {
  type: SSEEventType;
  data: any;
}

/**
 * 推理事件
 */
interface ReasoningEvent {
  reasoning: string;             // 推理文本片段
}

/**
 * 内容事件
 */
interface ContentEvent {
  content: string;               // 回复文本片段
}

/**
 * 完成事件
 */
interface DoneEvent {
  status: 'completed';
}

/**
 * 错误事件
 */
interface ErrorEvent {
  error: string;                 // 错误信息
  code?: string;                 // 错误码
}
```

### 3.4 历史记录模型

```typescript
/**
 * 历史记录项
 */
interface HistoryTask {
  id: string;                    // 任务ID
  title: string;                 // 标题（第一条消息）
  timestamp: string;             // 时间戳（ISO 8601）
  messageCount?: number;         // 消息数量
}

/**
 * 历史记录列表响应
 */
interface HistoryListResponse {
  tasks: Array<{
    taskId: string;
    firstMessage: string;
    startTime: string;
  }>;
}

/**
 * 历史对话详情响应
 */
interface HistoryDetailResponse {
  messages: Message[];
}
```

### 3.5 设置模型

```typescript
/**
 * 用户设置
 */
interface UserSettings {
  theme: 'light' | 'dark' | 'system';  // 主题模式
  language: 'zh-CN' | 'en-US';         // 语言
  typingSpeed: number;                 // 打字速度 (0-100)
}

/**
 * 主题模式
 */
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 更新设置请求
 */
interface UpdateSettingsRequest {
  userId: string;
  value: any;                    // 设置值
}
```

### 3.6 错误模型

```typescript
/**
 * API 错误响应
 */
interface ApiErrorResponse {
  code: string;                  // 错误码
  message: string;               // 错误信息
  details?: any;                 // 详细信息
}

/**
 * 客户端错误对象
 */
interface AppError extends Error {
  code?: string;                 // 错误码
  isApiError?: boolean;          // 是否为 API 错误
  statusCode?: number;           // HTTP 状态码
}
```

---

## 4. 接口层设计

### 4.1 API 服务封装

#### 4.1.1 基础 Axios 实例

```javascript
// core/api/request.js

import axios from 'axios';
import { errorHandler } from '@/core/errors/errorHandler';
import { logger } from '@/core/logger/logger';

// 创建 Axios 实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 添加 API Key
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }

    // 添加请求ID（用于日志追踪）
    const requestId = generateRequestId();
    config.headers['X-Request-ID'] = requestId;

    // 日志记录
    logger.debug('API Request', {
      requestId,
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data
    });

    return config;
  },
  (error) => {
    logger.error('Request Interceptor Error', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      requestId: response.config.headers['X-Request-ID'],
      status: response.status,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    // 错误处理
    const handled = errorHandler.handle(error);
    return Promise.reject(handled);
  }
);

// 导出请求方法
export const get = (url, params, config) =>
  instance.get(url, { params, ...config });

export const post = (url, data, config) =>
  instance.post(url, data, config);

export const put = (url, data, config) =>
  instance.put(url, data, config);

export const patch = (url, data, config) =>
  instance.patch(url, data, config);

export const del = (url, params, config) =>
  instance.delete(url, { params, ...config });

export default instance;
```

#### 4.1.2 认证 API

```javascript
// modules/auth/api/authApi.js

import { post } from '@/core/api/request';

/**
 * 用户登录
 */
export const login = async (username, password) => {
  return await post('/login', {
    username,
    password
  });
};

/**
 * 用户注册
 */
export const register = async (username, email, password) => {
  return await post('/register', {
    username,
    email,
    password
  });
};

/**
 * 退出登录
 */
export const logout = async () => {
  // 客户端清理逻辑
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('apiKey');
};
```

#### 4.1.3 聊天 API

```javascript
// modules/chat/api/chatApi.js

import { post } from '@/core/api/request';

/**
 * 开始新对话
 */
export const startConversation = async (content, userId) => {
  return await post('/start', {
    content,
    userId
  });
};

/**
 * 继续对话
 */
export const continueConversation = async (taskId, content) => {
  return await post('/continue', {
    taskId,
    content
  });
};

/**
 * 停止生成
 */
export const stopGeneration = async (taskId) => {
  return await post(`/stop/${taskId}`);
};
```

#### 4.1.4 SSE 客户端

```javascript
// modules/chat/api/sseClient.js

import { logger } from '@/core/logger/logger';

/**
 * SSE 客户端类
 */
export class SSEClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.eventSource = null;
    this.listeners = new Map();
  }

  /**
   * 连接 SSE
   */
  connect() {
    this.eventSource = new EventSource(this.url);

    // 注册事件监听器
    this.listeners.forEach((handler, event) => {
      this.eventSource.addEventListener(event, handler);
    });

    // 默认错误处理
    this.eventSource.onerror = (error) => {
      logger.error('SSE Error', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    };

    // 默认消息处理
    this.eventSource.onmessage = (event) => {
      if (this.options.onMessage) {
        this.options.onMessage(event);
      }
    };

    logger.info('SSE Connected', { url: this.url });
  }

  /**
   * 监听特定事件
   */
  on(event, handler) {
    this.listeners.set(event, handler);
    if (this.eventSource) {
      this.eventSource.addEventListener(event, handler);
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      logger.info('SSE Closed', { url: this.url });
    }
  }
}

/**
 * 创建 SSE 连接
 */
export const createSSEConnection = (taskId, userId, handlers) => {
  const url = `/api/events?taskId=${taskId}&userId=${userId}`;
  const client = new SSEClient(url, {
    onError: handlers.onError,
    onMessage: handlers.onMessage
  });

  // 注册事件监听器
  if (handlers.onReasoning) {
    client.on('reasoning', handlers.onReasoning);
  }
  if (handlers.onContent) {
    client.on('content', handlers.onContent);
  }
  if (handlers.onDone) {
    client.on('done', handlers.onDone);
  }
  if (handlers.onError) {
    client.on('error', handlers.onError);
  }

  client.connect();
  return client;
};
```

#### 4.1.5 历史记录 API

```javascript
// modules/history/api/historyApi.js

import { get, del } from '@/core/api/request';

/**
 * 获取历史记录列表
 */
export const getHistoryList = async (userId) => {
  return await get('/history', { userId });
};

/**
 * 获取历史对话详情
 */
export const getHistoryDetail = async (taskId, userId) => {
  return await get(`/history/${taskId}`, { userId });
};

/**
 * 删除历史记录
 */
export const deleteHistory = async (taskId, userId) => {
  return await del(`/history/${taskId}`, { userId });
};
```

### 4.2 API 端点配置

```javascript
// core/api/endpoints.js

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout'
  },

  // 聊天
  CHAT: {
    START: '/start',
    CONTINUE: '/continue',
    STOP: (taskId) => `/stop/${taskId}`,
    EVENTS: '/events'
  },

  // 历史记录
  HISTORY: {
    LIST: '/history',
    DETAIL: (taskId) => `/history/${taskId}`,
    DELETE: (taskId) => `/history/${taskId}`
  },

  // 用户
  USER: {
    PROFILE: (userId) => `/user/${userId}`,
    UPDATE: (userId) => `/user/${userId}`,
    RESET_API_KEY: (userId) => `/user/${userId}/reset-api-key`
  },

  // 设置
  SETTINGS: {
    GET: '/settings',
    UPDATE_THEME: '/settings/theme',
    UPDATE_LANGUAGE: '/settings/language',
    UPDATE_TYPING_SPEED: '/settings/typingSpeed'
  }
};
```

---

## 5. 状态管理方案

### 5.1 Pinia Store 架构

```
stores/
├── index.js                     # Store 注册
├── user.js                      # 用户状态
├── chat.js                      # 聊天状态
├── history.js                   # 历史记录状态
├── theme.js                     # 主题状态
└── settings.js                  # 设置状态
```

### 5.2 用户 Store

```javascript
// stores/user.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, register as registerApi, logout as logoutApi } from '@/modules/auth/api/authApi';
import { logger } from '@/core/logger/logger';

export const useUserStore = defineStore('user', () => {
  // State
  const userId = ref(localStorage.getItem('userId') || null);
  const username = ref(localStorage.getItem('username') || null);
  const apiKey = ref(localStorage.getItem('apiKey') || null);

  // Getters
  const isLoggedIn = computed(() => !!apiKey.value);
  const userInfo = computed(() => ({
    userId: userId.value,
    username: username.value,
    apiKey: apiKey.value
  }));

  // Actions
  async function login(credentials) {
    try {
      const response = await loginApi(credentials.username, credentials.password);

      // 保存用户信息
      userId.value = response.id;
      username.value = response.username;
      apiKey.value = response.api_key;

      // 持久化
      localStorage.setItem('userId', response.id);
      localStorage.setItem('username', response.username);
      localStorage.setItem('apiKey', response.api_key);

      logger.info('User logged in', { userId: response.id });

      return response;
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  async function register(userData) {
    try {
      const response = await registerApi(
        userData.username,
        userData.email,
        userData.password
      );

      // 保存用户信息
      userId.value = response.id;
      username.value = response.username;
      apiKey.value = response.api_key;

      // 持久化
      localStorage.setItem('userId', response.id);
      localStorage.setItem('username', response.username);
      localStorage.setItem('apiKey', response.api_key);

      logger.info('User registered', { userId: response.id });

      return response;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  function logout() {
    // 清理状态
    userId.value = null;
    username.value = null;
    apiKey.value = null;

    // 清理持久化
    logoutApi();

    logger.info('User logged out');
  }

  function updateProfile(updates) {
    if (updates.username) {
      username.value = updates.username;
      localStorage.setItem('username', updates.username);
    }
    if (updates.apiKey) {
      apiKey.value = updates.apiKey;
      localStorage.setItem('apiKey', updates.apiKey);
    }
  }

  return {
    // State
    userId,
    username,
    apiKey,

    // Getters
    isLoggedIn,
    userInfo,

    // Actions
    login,
    register,
    logout,
    updateProfile
  };
});
```

### 5.3 聊天 Store

```javascript
// stores/chat.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useChatStore = defineStore('chat', () => {
  // State
  const currentTaskId = ref(null);
  const conversationHistory = ref([]);
  const isGenerating = ref(false);

  // Getters
  const messageCount = computed(() => conversationHistory.value.length);
  const lastMessage = computed(() =>
    conversationHistory.value[conversationHistory.value.length - 1]
  );

  // Actions
  function setCurrentTask(taskId) {
    currentTaskId.value = taskId;
  }

  function addMessage(message) {
    conversationHistory.value.push({
      ...message,
      id: generateMessageId(),
      timestamp: Date.now()
    });
  }

  function updateLastMessage(updates) {
    if (conversationHistory.value.length === 0) return;

    const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
    Object.assign(lastMsg, updates);
  }

  function clearConversation() {
    conversationHistory.value = [];
    currentTaskId.value = null;
    isGenerating.value = false;
  }

  function loadConversation(messages, taskId) {
    conversationHistory.value = messages;
    currentTaskId.value = taskId;
  }

  function setGenerating(value) {
    isGenerating.value = value;
  }

  return {
    // State
    currentTaskId,
    conversationHistory,
    isGenerating,

    // Getters
    messageCount,
    lastMessage,

    // Actions
    setCurrentTask,
    addMessage,
    updateLastMessage,
    clearConversation,
    loadConversation,
    setGenerating
  };
});

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 5.4 Store 持久化

```javascript
// stores/index.js

import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();

// 持久化插件
pinia.use(
  createPersistedState({
    key: (id) => `moyu_ai_${id}`,
    storage: localStorage,
    // 指定需要持久化的 store
    include: ['user', 'theme', 'settings']
  })
);

export default pinia;
```

---

## 6. 错误处理机制

### 6.1 错误处理架构

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ try-catch
       ▼
┌──────────────┐
│  Composable  │
└──────┬───────┘
       │ throw
       ▼
┌──────────────┐
│   API Call   │
└──────┬───────┘
       │ Axios Interceptor
       ▼
┌──────────────┐
│ Error Handler│ ──▶ 日志记录
└──────┬───────┘
       │
       ├──▶ UI 提示 (Message)
       ├──▶ 路由跳转 (401)
       └──▶ 错误上报 (可选)
```

### 6.2 错误处理器实现

```javascript
// core/errors/errorHandler.js

import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { logger } from '@/core/logger/logger';
import { ERROR_CODES, getErrorMessage } from '@/core/errors/errorCodes';

class ErrorHandler {
  constructor() {
    this.router = null;
    this.message = null;
  }

  /**
   * 初始化错误处理器
   */
  init(router, message) {
    this.router = router;
    this.message = message;
  }

  /**
   * 处理错误
   */
  handle(error) {
    // 日志记录
    logger.error('Error occurred', {
      message: error.message,
      code: error.code,
      statusCode: error.response?.status,
      stack: error.stack
    });

    // 判断错误类型
    if (error.response) {
      // HTTP 错误
      return this.handleHttpError(error);
    } else if (error.request) {
      // 网络错误
      return this.handleNetworkError(error);
    } else {
      // 其他错误
      return this.handleGenericError(error);
    }
  }

  /**
   * 处理 HTTP 错误
   */
  handleHttpError(error) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return this.createError('BAD_REQUEST', data.message || '请求参数错误');

      case 401:
        this.handleUnauthorized();
        return this.createError('UNAUTHORIZED', '未授权，请重新登录');

      case 403:
        return this.createError('FORBIDDEN', '无权限访问');

      case 404:
        return this.createError('NOT_FOUND', '资源不存在');

      case 500:
        return this.createError('SERVER_ERROR', '服务器错误，请稍后重试');

      default:
        return this.createError(
          data.code || 'UNKNOWN_ERROR',
          data.message || '未知错误'
        );
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error) {
    this.showMessage('网络连接失败，请检查网络设置', 'error');
    return this.createError('NETWORK_ERROR', '网络连接失败');
  }

  /**
   * 处理通用错误
   */
  handleGenericError(error) {
    this.showMessage(error.message || '操作失败', 'error');
    return this.createError('GENERIC_ERROR', error.message);
  }

  /**
   * 处理未授权
   */
  handleUnauthorized() {
    // 清除登录信息
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('apiKey');

    // 跳转登录页
    if (this.router) {
      this.router.push('/login');
    }

    this.showMessage('登录已失效，请重新登录', 'warning');
  }

  /**
   * 创建错误对象
   */
  createError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.isApiError = true;
    return error;
  }

  /**
   * 显示消息提示
   */
  showMessage(content, type = 'error') {
    if (this.message) {
      this.message[type](content);
    }
  }
}

export const errorHandler = new ErrorHandler();
```

### 6.3 错误码定义

```javascript
// core/errors/errorCodes.js

/**
 * 错误码映射
 */
export const ERROR_CODES = {
  // 认证错误
  'INVALID_CREDENTIALS': '用户名或密码错误',
  'USER_NOT_FOUND': '用户不存在',
  'USERNAME_EXISTS': '用户名已被注册',
  'EMAIL_EXISTS': '邮箱已被注册',
  'UNAUTHORIZED': '未授权，请先登录',
  'TOKEN_EXPIRED': '登录已过期，请重新登录',

  // 请求错误
  'BAD_REQUEST': '请求参数错误',
  'FORBIDDEN': '无权限访问',
  'NOT_FOUND': '资源不存在',
  'METHOD_NOT_ALLOWED': '请求方法不允许',

  // 服务器错误
  'SERVER_ERROR': '服务器内部错误',
  'SERVICE_UNAVAILABLE': '服务暂时不可用',
  'GATEWAY_TIMEOUT': '网关超时',

  // 业务错误
  'TASK_NOT_FOUND': '对话任务不存在',
  'MESSAGE_TOO_LONG': '消息内容过长',
  'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后再试',

  // 网络错误
  'NETWORK_ERROR': '网络连接失败',
  'TIMEOUT_ERROR': '请求超时',

  // 通用错误
  'UNKNOWN_ERROR': '未知错误',
  'GENERIC_ERROR': '操作失败'
};

/**
 * 获取错误信息
 */
export function getErrorMessage(code, defaultMessage) {
  return ERROR_CODES[code] || defaultMessage || ERROR_CODES.UNKNOWN_ERROR;
}
```

---

## 7. 日志系统

### 7.1 日志级别

```typescript
enum LogLevel {
  DEBUG = 0,    // 调试信息
  INFO = 1,     // 一般信息
  WARN = 2,     // 警告
  ERROR = 3,    // 错误
  FATAL = 4     // 致命错误
}
```

### 7.2 日志实现

```javascript
// core/logger/logger.js

class Logger {
  constructor() {
    this.level = this.getLogLevel();
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * 获取日志级别
   */
  getLogLevel() {
    const env = import.meta.env.MODE;
    return env === 'production' ? 1 : 0; // 生产环境 INFO，开发环境 DEBUG
  }

  /**
   * 调试日志
   */
  debug(message, data) {
    if (this.level <= 0) {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * 信息日志
   */
  info(message, data) {
    if (this.level <= 1) {
      this.log('INFO', message, data);
    }
  }

  /**
   * 警告日志
   */
  warn(message, data) {
    if (this.level <= 2) {
      this.log('WARN', message, data);
    }
  }

  /**
   * 错误日志
   */
  error(message, error) {
    if (this.level <= 3) {
      this.log('ERROR', message, {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        ...error
      });
    }
  }

  /**
   * 致命错误日志
   */
  fatal(message, error) {
    this.log('FATAL', message, {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      ...error
    });

    // 上报到错误监控服务（如 Sentry）
    this.reportToMonitoring(message, error);
  }

  /**
   * 记录日志
   */
  log(level, message, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 输出到控制台
    this.outputToConsole(logEntry);

    // 保存到内存
    this.saveToMemory(logEntry);

    // 上报到服务器（可选）
    if (level === 'ERROR' || level === 'FATAL') {
      this.reportToServer(logEntry);
    }
  }

  /**
   * 输出到控制台
   */
  outputToConsole(logEntry) {
    const style = this.getConsoleStyle(logEntry.level);
    const prefix = `[${logEntry.timestamp}] [${logEntry.level}]`;

    console.log(
      `%c${prefix} ${logEntry.message}`,
      style,
      logEntry.data
    );
  }

  /**
   * 获取控制台样式
   */
  getConsoleStyle(level) {
    const styles = {
      DEBUG: 'color: #888',
      INFO: 'color: #0066cc',
      WARN: 'color: #ff9900',
      ERROR: 'color: #cc0000; font-weight: bold',
      FATAL: 'color: #fff; background: #cc0000; font-weight: bold'
    };
    return styles[level] || '';
  }

  /**
   * 保存到内存
   */
  saveToMemory(logEntry) {
    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * 上报到服务器
   */
  async reportToServer(logEntry) {
    try {
      // 发送到日志收集服务
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to report log to server', error);
    }
  }

  /**
   * 上报到监控服务
   */
  reportToMonitoring(message, error) {
    // 集成 Sentry 或其他监控服务
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: { message }
      });
    }
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * 导出日志
   */
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();
```

### 7.3 日志使用示例

```javascript
import { logger } from '@/core/logger/logger';

// 调试信息
logger.debug('User clicked button', { buttonId: 'submit' });

// 一般信息
logger.info('User logged in', { userId: '123' });

// 警告
logger.warn('API response slow', { responseTime: 5000 });

// 错误
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', error);
}

// 致命错误
logger.fatal('Critical system failure', criticalError);
```

---

## 8. 测试策略

### 8.1 测试金字塔

```
         ┌───────────┐
         │   E2E     │ ← 10% (核心用户流程)
         └───────────┘
       ┌───────────────┐
       │  Integration  │ ← 30% (API + 组件集成)
       └───────────────┘
    ┌─────────────────────┐
    │    Unit Tests       │ ← 60% (工具函数 + Store)
    └─────────────────────┘
```

### 8.2 单元测试

#### 8.2.1 测试工具

- **框架**: Vitest (Vue 3 专用)
- **组件测试**: @vue/test-utils
- **覆盖率**: c8 (Vitest 内置)

#### 8.2.2 测试配置

```javascript
// vitest.config.js

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.js',
        '**/*.d.ts'
      ],
      // 覆盖率阈值（符合 CONSTITUTION.md 要求）
      lines: 70,
      branches: 65,
      functions: 75,
      statements: 70
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
```

#### 8.2.3 测试示例

**工具函数测试**:
```javascript
// tests/unit/utils/markdown.spec.js

import { describe, it, expect } from 'vitest';
import { safeMarkdown } from '@/core/utils/markdown';

describe('Markdown Utils', () => {
  describe('safeMarkdown', () => {
    it('应该正确渲染 Markdown', () => {
      const input = '# Hello\n\nThis is **bold**.';
      const output = safeMarkdown(input);

      expect(output).toContain('<h1>Hello</h1>');
      expect(output).toContain('<strong>bold</strong>');
    });

    it('应该清理 XSS 攻击', () => {
      const input = '<script>alert("XSS")</script>';
      const output = safeMarkdown(input);

      expect(output).not.toContain('<script>');
    });

    it('应该高亮代码块', () => {
      const input = '```javascript\nconst a = 1;\n```';
      const output = safeMarkdown(input);

      expect(output).toContain('<code');
      expect(output).toContain('class="language-javascript"');
    });
  });
});
```

**Store 测试**:
```javascript
// tests/unit/stores/user.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('应该正确初始化状态', () => {
    const store = useUserStore();

    expect(store.userId).toBeNull();
    expect(store.username).toBeNull();
    expect(store.isLoggedIn).toBe(false);
  });

  it('登录后应该保存用户信息', async () => {
    const store = useUserStore();

    // Mock API
    vi.mock('@/modules/auth/api/authApi', () => ({
      login: vi.fn().mockResolvedValue({
        id: '123',
        username: 'testuser',
        api_key: 'sk-test'
      })
    }));

    await store.login({
      username: 'testuser',
      password: 'password'
    });

    expect(store.userId).toBe('123');
    expect(store.username).toBe('testuser');
    expect(store.isLoggedIn).toBe(true);
    expect(localStorage.getItem('userId')).toBe('123');
  });

  it('登出后应该清除用户信息', () => {
    const store = useUserStore();

    // 先设置用户信息
    store.userId = '123';
    store.username = 'testuser';
    store.apiKey = 'sk-test';
    localStorage.setItem('userId', '123');

    // 登出
    store.logout();

    expect(store.userId).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(localStorage.getItem('userId')).toBeNull();
  });
});
```

**组件测试**:
```javascript
// tests/unit/components/ChatInput.spec.js

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatInput from '@/modules/chat/components/ChatInput.vue';

describe('ChatInput', () => {
  it('应该正确渲染', () => {
    const wrapper = mount(ChatInput, {
      props: {
        disabled: false,
        isGenerating: false
      }
    });

    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('输入内容后应该启用发送按钮', async () => {
    const wrapper = mount(ChatInput);
    const textarea = wrapper.find('textarea');
    const sendBtn = wrapper.find('button[type="submit"]');

    // 初始状态禁用
    expect(sendBtn.attributes('disabled')).toBeDefined();

    // 输入内容
    await textarea.setValue('Hello');

    // 发送按钮启用
    expect(sendBtn.attributes('disabled')).toBeUndefined();
  });

  it('点击发送应该触发 send 事件', async () => {
    const wrapper = mount(ChatInput);
    const textarea = wrapper.find('textarea');
    const sendBtn = wrapper.find('button[type="submit"]');

    await textarea.setValue('Hello');
    await sendBtn.trigger('click');

    expect(wrapper.emitted('send')).toBeTruthy();
    expect(wrapper.emitted('send')[0][0]).toBe('Hello');
  });

  it('Ctrl+Enter 应该发送消息', async () => {
    const wrapper = mount(ChatInput);
    const textarea = wrapper.find('textarea');

    await textarea.setValue('Hello');
    await textarea.trigger('keydown', {
      key: 'Enter',
      ctrlKey: true
    });

    expect(wrapper.emitted('send')).toBeTruthy();
  });

  it('生成中时应该禁用输入', () => {
    const wrapper = mount(ChatInput, {
      props: {
        isGenerating: true
      }
    });

    const textarea = wrapper.find('textarea');
    const sendBtn = wrapper.find('button[type="submit"]');

    expect(textarea.attributes('disabled')).toBeDefined();
    expect(sendBtn.attributes('disabled')).toBeDefined();
  });
});
```

#### 8.2.4 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式（开发时）
npm run test:watch

# 运行特定测试文件
npm run test -- markdown.spec.js
```

### 8.3 集成测试

#### 8.3.1 API 集成测试

```javascript
// tests/integration/api/chat.spec.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startConversation, continueConversation } from '@/modules/chat/api/chatApi';
import { createMockServer } from '../helpers/mockServer';

describe('Chat API Integration', () => {
  let server;

  beforeEach(() => {
    server = createMockServer();
  });

  afterEach(() => {
    server.close();
  });

  it('应该成功开始对话', async () => {
    server.post('/api/start', {
      taskId: 'task_123'
    });

    const result = await startConversation('Hello', 'user_123');

    expect(result.taskId).toBe('task_123');
  });

  it('应该成功继续对话', async () => {
    server.post('/api/continue', {
      success: true
    });

    const result = await continueConversation('task_123', 'How are you?');

    expect(result.success).toBe(true);
  });

  it('API 错误时应该抛出异常', async () => {
    server.post('/api/start', null, 500);

    await expect(
      startConversation('Hello', 'user_123')
    ).rejects.toThrow();
  });
});
```

#### 8.3.2 组件集成测试

```javascript
// tests/integration/components/HomeView.spec.js

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from '@/modules/chat/views/HomeView.vue';

describe('HomeView Integration', () => {
  it('应该正确加载历史记录', async () => {
    const pinia = createPinia();

    // Mock API
    vi.mock('@/modules/history/api/historyApi', () => ({
      getHistoryList: vi.fn().mockResolvedValue({
        tasks: [
          { taskId: '1', firstMessage: 'Hello', startTime: '2025-01-01' }
        ]
      })
    }));

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia]
      }
    });

    await wrapper.vm.$nextTick();

    // 验证历史记录加载
    expect(wrapper.find('.history-item').exists()).toBe(true);
  });

  it('应该正确发送消息', async () => {
    const pinia = createPinia();
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia]
      }
    });

    const input = wrapper.findComponent(ChatInput);

    // 模拟输入
    await input.vm.$emit('send', 'Hello');

    // 验证消息显示
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Hello');
  });
});
```

### 8.4 E2E 测试

#### 8.4.1 Playwright 配置

```javascript
// playwright.config.js

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 8.4.2 E2E 测试示例

**用户注册登录流程**:
```javascript
// tests/e2e/auth.spec.js

import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test('新用户注册并首次对话', async ({ page }) => {
    // 1. 访问应用
    await page.goto('/');

    // 2. 点击注册
    await page.click('text=注册');

    // 3. 填写注册信息
    await page.fill('input[placeholder="请输入用户名"]', 'testuser');
    await page.fill('input[placeholder="请输入邮箱"]', 'test@example.com');
    await page.fill('input[placeholder="请输入密码"]', 'password123');
    await page.fill('input[placeholder="请再次输入密码"]', 'password123');

    // 4. 提交注册
    await page.click('button:has-text("注册")');

    // 5. 验证跳转到对话页
    await expect(page).toHaveURL('/chat');

    // 6. 验证空状态显示
    await expect(page.locator('.empty-state')).toBeVisible();

    // 7. 输入第一条消息
    await page.fill('textarea', '你好');
    await page.click('button:has-text("发送")');

    // 8. 验证消息显示
    await expect(page.locator('.user-message')).toContainText('你好');

    // 9. 验证 AI 回复
    await expect(page.locator('.assistant-message')).toBeVisible({
      timeout: 10000
    });
  });

  test('用户登录', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[placeholder="请输入用户名"]', 'testuser');
    await page.fill('input[placeholder="请输入密码"]', 'password123');
    await page.click('button:has-text("登录")');

    await expect(page).toHaveURL('/chat');
  });
});
```

**聊天功能流程**:
```javascript
// tests/e2e/chat.spec.js

import { test, expect } from '@playwright/test';

test.describe('聊天功能', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟登录状态
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userId', 'test_user');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('apiKey', 'sk-test');
    });
    await page.goto('/chat');
  });

  test('发送消息并接收回复', async ({ page }) => {
    // 输入消息
    await page.fill('textarea', '介绍一下 Vue 3');
    await page.click('button[aria-label="发送"]');

    // 验证用户消息显示
    await expect(page.locator('.user-message').last()).toContainText('介绍一下 Vue 3');

    // 验证加载状态
    await expect(page.locator('.typing-indicator')).toBeVisible();

    // 验证 AI 回复
    await expect(page.locator('.assistant-message').last()).toBeVisible({
      timeout: 15000
    });
  });

  test('停止生成', async ({ page }) => {
    // 发送消息
    await page.fill('textarea', '写一篇很长的文章');
    await page.click('button[aria-label="发送"]');

    // 等待开始生成
    await page.waitForSelector('.typing-indicator');

    // 点击停止
    await page.click('button[aria-label="停止生成"]');

    // 验证停止标记
    await expect(page.locator('.assistant-message').last()).toContainText('[用户已停止生成]');
  });

  test('清空对话', async ({ page }) => {
    // 发送几条消息
    await page.fill('textarea', '消息1');
    await page.click('button[aria-label="发送"]');

    await page.waitForTimeout(1000);

    // 点击清空
    await page.click('button[aria-label="清空对话"]');

    // 确认
    await page.click('button:has-text("确定")');

    // 验证空状态
    await expect(page.locator('.empty-state')).toBeVisible();
  });
});
```

**历史记录流程**:
```javascript
// tests/e2e/history.spec.js

import { test, expect } from '@playwright/test';

test.describe('历史记录', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟登录
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('userId', 'test_user');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('apiKey', 'sk-test');
    });
    await page.goto('/chat');
  });

  test('加载历史记录', async ({ page }) => {
    // 验证侧边栏显示
    await expect(page.locator('.history-sidebar')).toBeVisible();

    // 验证历史项
    await expect(page.locator('.history-item')).toHaveCount(3);
  });

  test('点击历史项加载对话', async ({ page }) => {
    // 点击第一个历史项
    await page.click('.history-item:first-child');

    // 验证对话加载
    await expect(page.locator('.message-wrapper')).toHaveCount(4);
  });

  test('删除历史记录', async ({ page }) => {
    // 悬停显示删除按钮
    await page.hover('.history-item:first-child');

    // 点击删除
    await page.click('.history-item:first-child button[aria-label="删除"]');

    // 确认删除
    await page.click('button:has-text("确定")');

    // 验证删除成功
    await expect(page.locator('.history-item')).toHaveCount(2);
  });
});
```

**响应式测试**:
```javascript
// tests/e2e/responsive.spec.js

import { test, expect, devices } from '@playwright/test';

test.describe('响应式设计', () => {
  test('移动端布局', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize(devices['iPhone 12'].viewport);
    await page.goto('/chat');

    // 验证移动端布局
    await expect(page.locator('.history-sidebar')).not.toBeVisible();

    // 点击历史按钮
    await page.click('button[aria-label="历史记录"]');

    // 验证抽屉打开
    await expect(page.locator('.n-drawer')).toBeVisible();
  });

  test('桌面端布局', async ({ page }) => {
    // 设置桌面端视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/chat');

    // 验证桌面端布局
    await expect(page.locator('.history-sidebar')).toBeVisible();
    await expect(page.locator('.n-drawer')).not.toBeVisible();
  });
});
```

#### 8.4.3 运行 E2E 测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 运行特定浏览器
npm run test:e2e -- --project=chromium

# 调试模式
npm run test:e2e -- --debug

# 生成报告
npm run test:e2e -- --reporter=html
```

### 8.5 测试覆盖率要求

**最低标准** (符合 CONSTITUTION.md):

| 指标 | 最低值 | 目标值 |
|------|--------|--------|
| 行覆盖率 | 70% | 80% |
| 分支覆盖率 | 65% | 75% |
| 函数覆盖率 | 75% | 85% |
| 语句覆盖率 | 70% | 80% |

**必须测试的模块**:
- ✅ core/utils/ (所有工具函数)
- ✅ stores/ (所有 Store)
- ✅ modules/*/api/ (所有 API 方法)
- ✅ core/errors/ (错误处理)

**豁免模块**:
- UI 动画效果
- 第三方库 wrapper
- 临时调试代码

---

## 9. 性能优化策略

### 9.1 代码分包策略

#### 9.1.1 路由懒加载

```javascript
// router/routes.js

export const routes = [
  {
    path: '/login',
    name: 'login',
    // 懒加载
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/modules/chat/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/modules/settings/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
];
```

#### 9.1.2 组件懒加载

```vue
<!-- HomeView.vue -->
<script setup>
import { defineAsyncComponent } from 'vue';

// 懒加载非关键组件
const HistorySidebar = defineAsyncComponent(() =>
  import('@/modules/history/components/HistorySidebar.vue')
);

const VirtualMessageList = defineAsyncComponent(() =>
  import('@/modules/chat/components/VirtualMessageList.vue')
);
</script>
```

#### 9.1.3 Vite 打包配置

```javascript
// vite.config.js

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          // Vue 相关
          'vue-vendor': ['vue', 'vue-router', 'pinia'],

          // UI 库
          'ui-vendor': ['naive-ui'],

          // Markdown 相关
          'markdown-vendor': ['marked', 'highlight.js', 'dompurify'],

          // 工具库
          'utils-vendor': ['axios']
        },

        // 代码分割命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // 生产环境移除 console
        drop_debugger: true,     // 移除 debugger
        pure_funcs: ['console.log'] // 移除特定函数调用
      }
    },

    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500
  }
});
```

### 9.2 资源优化

#### 9.2.1 图片优化

```javascript
// vite.config.js

export default defineConfig({
  plugins: [
    vue(),

    // 图片压缩插件
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false
      },
      optipng: {
        optimizationLevel: 7
      },
      mozjpeg: {
        quality: 80
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox'
          },
          {
            name: 'removeEmptyAttrs',
            active: false
          }
        ]
      }
    })
  ]
});
```

#### 9.2.2 字体优化

```css
/* 字体子集化 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font-subset.woff2') format('woff2');
  font-display: swap; /* 避免 FOIT */
  unicode-range: U+4E00-9FFF; /* 仅加载中文字符 */
}
```

#### 9.2.3 CSS 优化

```javascript
// tailwind.config.js

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [],

  // 生产环境 Purge 未使用的样式
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    options: {
      safelist: [
        // 保留动态生成的类名
        /^n-/,  // Naive UI 类名
        /^hljs-/ // highlight.js 类名
      ]
    }
  }
};
```

### 9.3 缓存策略

#### 9.3.1 HTTP 缓存

```nginx
# nginx.conf

# 静态资源缓存（1年）
location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# HTML 不缓存
location ~* \.html$ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# API 响应不缓存
location /api/ {
  add_header Cache-Control "no-store";
  proxy_pass http://backend;
}
```

#### 9.3.2 Service Worker 缓存

```javascript
// sw.js (可选，PWA 支持)

const CACHE_NAME = 'moyu-ai-v1';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/assets/js/vendor.js',
  '/assets/css/index.css'
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

#### 9.3.3 LocalStorage 缓存

```javascript
// core/utils/cache.js

class CacheManager {
  /**
   * 设置缓存
   */
  set(key, value, ttl = 3600000) { // 默认 1 小时
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  }

  /**
   * 获取缓存
   */
  get(key) {
    const itemStr = localStorage.getItem(`cache_${key}`);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   */
  remove(key) {
    localStorage.removeItem(`cache_${key}`);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cache_'))
      .forEach((key) => localStorage.removeItem(key));
  }
}

export const cache = new CacheManager();
```

### 9.4 长列表优化

#### 9.4.1 虚拟滚动实现

```vue
<!-- modules/chat/components/VirtualMessageList.vue -->
<template>
  <VirtualList
    :data="messages"
    :item-height="100"
    :buffer="5"
  >
    <template #default="{ item }">
      <MessageItem :message="item" />
    </template>
  </VirtualList>
</template>

<script setup>
import { VirtualList } from 'virtua/vue';
import MessageItem from './MessageItem.vue';

defineProps({
  messages: {
    type: Array,
    required: true
  }
});
</script>
```

#### 9.4.2 分页加载

```javascript
// modules/history/composables/useHistory.js

export function useHistory() {
  const historyList = ref([]);
  const page = ref(1);
  const pageSize = 20;
  const hasMore = ref(true);
  const loading = ref(false);

  /**
   * 加载更多
   */
  async function loadMore() {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    try {
      const result = await getHistoryList(userId, page.value, pageSize);

      historyList.value.push(...result.tasks);
      page.value++;
      hasMore.value = result.tasks.length === pageSize;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 下拉刷新
   */
  async function refresh() {
    page.value = 1;
    hasMore.value = true;
    historyList.value = [];
    await loadMore();
  }

  return {
    historyList,
    loading,
    hasMore,
    loadMore,
    refresh
  };
}
```

### 9.5 骨架屏

```vue
<!-- shared/components/SkeletonChat.vue -->
<template>
  <div class="skeleton-chat">
    <!-- 消息骨架 -->
    <div v-for="i in 3" :key="i" class="skeleton-message">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-line w-3/4"></div>
        <div class="skeleton-line w-full"></div>
        <div class="skeleton-line w-2/3"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
```

### 9.6 接口合并

```javascript
// core/api/batchRequest.js

class BatchRequestManager {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.delay = 50; // 50ms 内的请求合并
  }

  /**
   * 添加请求到队列
   */
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  /**
   * 执行批量请求
   */
  async flush() {
    const batch = this.queue.splice(0);
    this.timer = null;

    if (batch.length === 0) return;

    // 合并请求
    const requests = batch.map((item) => item.request);

    try {
      const result = await post('/api/batch', { requests });

      // 分发结果
      result.responses.forEach((response, index) => {
        batch[index].resolve(response);
      });
    } catch (error) {
      // 所有请求失败
      batch.forEach((item) => item.reject(error));
    }
  }
}

export const batchRequest = new BatchRequestManager();
```

### 9.7 性能监控

```javascript
// core/utils/performance.js

class PerformanceMonitor {
  /**
   * 监控 FCP
   */
  measureFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          logger.info('FCP', {
            value: entry.startTime,
            threshold: 1000, // 目标 < 1s
            pass: entry.startTime < 1000
          });
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  /**
   * 监控 LCP
   */
  measureLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      logger.info('LCP', {
        value: lastEntry.startTime,
        threshold: 2000, // 目标 < 2s
        pass: lastEntry.startTime < 2000
      });
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  /**
   * 监控 FID
   */
  measureFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logger.info('FID', {
          value: entry.processingStart - entry.startTime,
          threshold: 100, // 目标 < 100ms
          pass: (entry.processingStart - entry.startTime) < 100
        });
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  /**
   * 监控 API 响应时间
   */
  measureAPITime(url, startTime) {
    const duration = Date.now() - startTime;

    logger.info('API Response Time', {
      url,
      duration,
      threshold: 2000, // 目标 < 2s
      pass: duration < 2000
    });

    // 慢请求告警
    if (duration > 5000) {
      logger.warn('Slow API Request', { url, duration });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## 10. 开发规范与质量保证

### 10.1 代码规范

#### 10.1.1 ESLint 配置

```javascript
// eslint.config.js

import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  skipFormatting,

  // 自定义规则（对齐 CONSTITUTION.md）
  {
    rules: {
      // 复杂度限制
      'complexity': ['error', 10],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['error', { max: 50 }],
      'max-params': ['error', 4],

      // 最佳实践
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-magic-numbers': ['warn', {
        ignore: [0, 1, -1],
        ignoreArrayIndexes: true
      }],

      // Vue 特定
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',

      // 命名规范
      'camelcase': ['error', { properties: 'never' }],
    }
  }
];
```

#### 10.1.2 Prettier 配置

```javascript
// .prettierrc.js

export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  printWidth: 100,
  vueIndentScriptAndStyle: false,
};
```

#### 10.1.3 Git Hooks

```json
// package.json

{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
npm run test:changed
```

### 10.2 提交规范

```bash
# .husky/commit-msg

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

```javascript
// commitlint.config.js

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',      // 新功能
        'fix',       // Bug修复
        'docs',      // 文档更新
        'style',     // 代码格式
        'refactor',  // 重构
        'perf',      // 性能优化
        'test',      // 测试
        'chore',     // 构建/工具
        'revert',    // 回退
      ],
    ],
    'subject-max-length': [2, 'always', 100],
  },
};
```

### 10.3 代码审查清单

**提交前检查**:
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] Prettier 格式化完成 (`npm run format`)
- [ ] 所有测试通过 (`npm run test`)
- [ ] 覆盖率达标 (≥ 70%)
- [ ] 无 console.log / debugger
- [ ] 添加必要注释
- [ ] 更新相关文档

**代码审查要点**:
- [ ] 符合编码规范（CONSTITUTION.md 第一章）
- [ ] 函数复杂度 ≤ 10
- [ ] 组件代码 ≤ 500 行
- [ ] Props 有类型和默认值
- [ ] 错误处理完善
- [ ] 性能优化（虚拟滚动、懒加载等）
- [ ] 无安全漏洞（XSS、CSRF等）
- [ ] 响应式设计（移动端 + 桌面端）

---

## 11. 部署方案

### 11.1 构建流程

```bash
# 安装依赖
npm ci

# 运行测试
npm run test

# 构建生产版本
npm run build

# 生成性能报告
npm run build -- --report
```

### 11.2 Docker 部署

```dockerfile
# Dockerfile

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf

server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  # Gzip 压缩
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
  gzip_min_length 1000;

  # 静态资源缓存
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # SPA 路由
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API 代理
  location /api/ {
    proxy_pass http://backend:8999;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 11.3 CI/CD 流程

```yaml
# .github/workflows/ci.yml

name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Deploy to production
        run: |
          # 部署到服务器或 CDN
          # 例如: rsync -avz dist/ user@server:/var/www/html/
```

---

## 12. 实施时间表

### 12.1 第一阶段：基础架构（2周）

**Week 1**:
- [ ] 项目初始化（Vite + Vue 3）
- [ ] 配置 ESLint + Prettier + Husky
- [ ] 搭建模块化架构
- [ ] 实现核心 API 层（Axios 封装、拦截器）
- [ ] 实现错误处理机制
- [ ] 实现日志系统

**Week 2**:
- [ ] 实现状态管理（Pinia Stores）
- [ ] 实现路由系统（Vue Router + 守卫）
- [ ] 配置测试框架（Vitest + Playwright）
- [ ] 编写核心工具函数（Markdown 渲染、安全处理）
- [ ] 实现主题系统
- [ ] 基础 UI 组件封装

### 12.2 第二阶段：核心功能（3周）

**Week 3-4**:
- [ ] 实现认证模块（登录、注册、登出）
- [ ] 实现聊天模块（消息发送、SSE 流式响应）
- [ ] 实现打字效果
- [ ] 实现 Markdown + 代码高亮
- [ ] 编写单元测试（工具函数 + Store）

**Week 5**:
- [ ] 实现历史记录模块（列表、详情、删除）
- [ ] 实现设置模块（用户资料、安全、外观）
- [ ] 响应式设计（移动端 + 桌面端）
- [ ] 编写集成测试（API + 组件）

### 12.3 第三阶段：优化与测试（2周）

**Week 6**:
- [ ] 性能优化（代码分包、懒加载、虚拟滚动）
- [ ] 实现骨架屏
- [ ] 实现缓存策略
- [ ] 编写 E2E 测试（核心流程）

**Week 7**:
- [ ] 安全加固（XSS 防护、CSRF 防护）
- [ ] 无障碍性优化（A11y）
- [ ] 跨浏览器测试
- [ ] 性能监控与优化

### 12.4 第四阶段：部署与上线（1周）

**Week 8**:
- [ ] 配置生产环境构建
- [ ] Docker 容器化
- [ ] CI/CD 流程搭建
- [ ] 部署到生产环境
- [ ] 性能验证（Lighthouse）
- [ ] 文档完善

---

## 13. 总结

本技术实施计划完全对齐项目宪法（CONSTITUTION.md）和项目规范（PROJECT_SPECIFICATION.md），提供了详细的技术方案和实施路径。

### 13.1 关键成功因素

1. **严格遵守代码规范**: ESLint + Prettier 自动化检查
2. **全面的测试覆盖**: 单元测试 + 集成测试 + E2E 测试
3. **性能优化到位**: 首屏加载 < 2s，符合 Core Web Vitals
4. **用户体验一致**: 响应式设计，无障碍性支持
5. **模块化架构**: 清晰的分层和模块划分，易于维护

### 13.2 风险与对策

**风险 1**: 测试覆盖率不达标
- **对策**: 从第一周起就编写测试，测试驱动开发（TDD）

**风险 2**: 性能优化不足
- **对策**: 定期运行 Lighthouse，实时监控性能指标

**风险 3**: 代码质量下降
- **对策**: 强制代码审查，Git Hooks 自动检查

**风险 4**: 进度延期
- **对策**: 敏捷开发，每周迭代，及时调整

### 13.3 后续优化

**v1.1 计划**:
- TypeScript 迁移
- PWA 支持
- 国际化（i18n）
- 更多测试用例

**v2.0 计划**:
- SSR 服务端渲染
- 微前端架构
- 性能进一步优化

---

**文档维护**: 本文档应随项目演进持续更新
**反馈渠道**: 请提交 Issue 到项目仓库
**最后更新**: 2025-01
