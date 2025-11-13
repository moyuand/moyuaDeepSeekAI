# 墨鱼AI智能助手 - 项目宪法

> **版本**: v1.0.0
> **生效日期**: 2025年
> **适用范围**: 墨鱼AI智能助手项目的所有代码、文档和资源

本文档定义了项目的最高级别开发原则和标准，所有团队成员和贡献者必须严格遵守。

---

## 目录

- [第一章 代码质量标准](#第一章-代码质量标准)
- [第二章 测试标准](#第二章-测试标准)
- [第三章 用户体验一致性](#第三章-用户体验一致性)
- [第四章 性能要求](#第四章-性能要求)
- [第五章 安全规范](#第五章-安全规范)
- [第六章 文档规范](#第六章-文档规范)
- [第七章 版本控制规范](#第七章-版本控制规范)

---

## 第一章 代码质量标准

### 1.1 代码风格

#### 1.1.1 JavaScript/Vue 规范

**强制要求**:

1. **缩进**: 使用 Tab 字符缩进（项目现有标准）
2. **引号**: 优先使用单引号 `'`，模板字符串除外
3. **分号**: 语句末尾不强制分号，由 Prettier 自动处理
4. **命名规范**:
   - 变量/函数: `camelCase` (如 `userName`, `getUserInfo`)
   - 常量: `UPPER_SNAKE_CASE` (如 `API_BASE_URL`, `MAX_RETRY_COUNT`)
   - 组件名: `PascalCase` (如 `ChatHeader`, `HistorySidebar`)
   - 文件名:
     - 组件文件: `PascalCase.vue` (如 `HomeView.vue`)
     - 工具文件: `camelCase.js` (如 `request.js`)
     - Store文件: `camelCase.js` (如 `userStore.js`)

5. **Vue 组件顺序**:
   ```vue
   <template>
     <!-- 模板内容 -->
   </template>

   <script setup>
   // 1. 导入语句
   // 2. Props 定义
   // 3. Emits 定义
   // 4. 响应式数据
   // 5. 计算属性
   // 6. 监听器
   // 7. 生命周期钩子
   // 8. 方法
   </script>

   <style scoped>
   /* 样式 */
   </style>
   ```

6. **注释规范**:
   - 单行注释: `// 注释内容`
   - 多行注释: `/* 注释内容 */`
   - 函数注释:
     ```javascript
     /**
      * 发送消息到服务器
      * @param {string} content - 消息内容
      * @param {string} taskId - 任务ID（可选）
      * @returns {Promise<Object>} 服务器响应
      */
     ```

#### 1.1.2 CSS/样式规范

**样式方案优先级**:

1. **第一优先: TailwindCSS 工具类**
2. **第二优先: Scoped CSS（仅在 TailwindCSS 无法满足时使用）**
3. **禁止: 内联样式（除特殊情况）**

**强制要求**:

1. **优先使用 TailwindCSS**:
   ```vue
   <!-- ✅ 正确 - 使用 TailwindCSS -->
   <template>
     <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
       <h1 class="text-xl font-semibold text-gray-900 dark:text-white">标题</h1>
       <button class="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
         按钮
       </button>
     </div>
   </template>

   <!-- ❌ 错误 - 不必要的自定义样式 -->
   <template>
     <div class="header">
       <h1 class="title">标题</h1>
     </div>
   </template>
   <style scoped>
   .header {
     display: flex;
     padding: 16px;
     background: white;
   }
   </style>
   ```

2. **Scoped CSS 使用场景**（仅在以下情况使用）:
   - 复杂的动画和过渡效果
   - 需要使用 Naive UI CSS 变量的场景
   - 极其复杂的布局（TailwindCSS 类名超过 10 个）
   - 第三方组件样式覆盖

   ```vue
   <style scoped>
   /* ✅ 正确 - 使用 Naive UI 变量 */
   .custom-component {
     color: var(--n-text-color);
     background: var(--n-color-card);
   }

   /* ✅ 正确 - 复杂动画 */
   @keyframes float {
     0%, 100% { transform: translateY(0); }
     50% { transform: translateY(-10px); }
   }
   .floating {
     animation: float 3s ease-in-out infinite;
   }
   </style>
   ```

3. **类名规范**（用于 Scoped CSS）:
   - 使用 BEM 命名或语义化命名
   - 避免过于通用的类名
   ```css
   /* BEM 风格 */
   .chat-header {}
   .chat-header__title {}
   .chat-header__button--active {}

   /* 语义化风格 */
   .user-message {}
   .assistant-message {}
   ```

4. **响应式设计**:
   - **优先使用 TailwindCSS 响应式前缀**: `sm:`, `md:`, `lg:`, `xl:`
   ```vue
   <!-- ✅ 正确 -->
   <div class="text-sm md:text-base lg:text-lg">响应式文本</div>
   <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">...</div>
   ```

   - **断点标准**（与 TailwindCSS 默认配置一致）:
     - `sm`: ≥ 640px
     - `md`: ≥ 768px
     - `lg`: ≥ 1024px
     - `xl`: ≥ 1280px
     - `2xl`: ≥ 1536px

5. **主题适配**:
   - **优先使用 TailwindCSS dark 模式**: `dark:` 前缀
   ```vue
   <div class="bg-white dark:bg-gray-900 text-black dark:text-white">
     主题自适应内容
   </div>
   ```

   - **必要时使用 Naive UI CSS 变量**:
   ```css
   color: var(--n-text-color);
   background: var(--n-color-card);
   border-color: var(--n-border-color);
   ```

6. **禁止内联样式**:
   ```vue
   <!-- ❌ 错误 -->
   <div :style="{ color: 'red', fontSize: '16px' }">内容</div>

   <!-- ✅ 正确 -->
   <div class="text-red-500 text-base">内容</div>

   <!-- ✅ 例外 - 动态计算值 -->
   <div :style="{ width: `${progress}%` }">进度条</div>
   ```

### 1.2 代码一致性

#### 1.2.1 统一的 API 调用方式

**强制使用 `@/utils/request.js` 封装**:

```javascript
// ✅ 正确
import { get, post } from '@/utils/request';
const data = await get('/api/endpoint');

// ❌ 错误
import axios from 'axios';
const data = await axios.get('/api/endpoint');
```

#### 1.2.2 统一的状态管理

**强制使用 Pinia Stores**:

```javascript
// ✅ 正确
import { useUserStore } from '@/stores';
const userStore = useUserStore();

// ❌ 错误 - 不要使用全局变量
window.userData = {...};
```

#### 1.2.3 统一的错误处理

**标准错误处理模式**:

```javascript
try {
  const result = await apiCall();
  // 处理成功结果
} catch (error) {
  console.error('操作失败:', error);
  message.error(error.message || '操作失败');
  // 可选: 上报错误到监控系统
}
```

### 1.3 可维护性标准

#### 1.3.1 函数复杂度限制

**强制要求**:

1. **单个函数行数**: ≤ 50 行（不包含注释和空行）
2. **函数参数数量**: ≤ 4 个（超过时使用对象参数）
3. **嵌套层级**: ≤ 3 层
4. **圈复杂度**: ≤ 10

**重构示例**:

```javascript
// ❌ 错误 - 参数过多
function createUser(name, email, age, gender, address, phone) {}

// ✅ 正确 - 使用对象参数
function createUser({ name, email, age, gender, address, phone }) {}
```

#### 1.3.2 组件拆分原则

**强制要求**:

1. **单个组件行数**: ≤ 500 行
2. **组件职责**: 单一职责原则，一个组件只做一件事
3. **可复用组件**: 提取到 `src/components/` 目录
4. **页面组件**: 放在 `src/views/` 目录

#### 1.3.3 Magic Number 禁止

**强制要求**:

```javascript
// ❌ 错误
if (user.age > 18) {}
setTimeout(() => {}, 3000);

// ✅ 正确
const ADULT_AGE = 18;
const TOAST_DURATION = 3000;

if (user.age > ADULT_AGE) {}
setTimeout(() => {}, TOAST_DURATION);
```

---

## 第二章 测试标准

### 2.1 单元测试

#### 2.1.1 覆盖率要求

**最低标准**:

| 指标 | 目标值 | 最低值 | 说明 |
|------|--------|--------|------|
| 行覆盖率 (Line) | 80% | 70% | 所有可执行代码行 |
| 分支覆盖率 (Branch) | 75% | 65% | 所有条件分支 |
| 函数覆盖率 (Function) | 85% | 75% | 所有函数 |
| 语句覆盖率 (Statement) | 80% | 70% | 所有语句 |

**豁免情况**:

- UI 动画和过渡效果
- 第三方库的 wrapper
- 临时的调试代码

#### 2.1.2 必须测试的内容

**强制要求**:

1. **核心工具函数** (`src/utils/`):
   - `request.js` 所有导出函数
   - `markdown.js` Markdown 渲染和安全处理
   - 所有数据处理函数

2. **Store 状态管理** (`src/stores/`):
   - 所有 state mutations
   - 所有 getters
   - 所有 actions

3. **业务逻辑函数**:
   - 数据验证函数
   - 格式化函数
   - 业务计算函数

#### 2.1.3 测试文件组织

**文件命名规范**:

```
src/
├── utils/
│   ├── request.js
│   └── request.spec.js       # 单元测试
├── stores/
│   ├── user.js
│   └── user.spec.js
└── components/
    ├── ChatHeader.vue
    └── ChatHeader.spec.js
```

**测试结构模板**:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName 或 FunctionName', () => {
  beforeEach(() => {
    // 测试前准备
  });

  afterEach(() => {
    // 测试后清理
  });

  it('应该正确处理正常情况', () => {
    // Arrange (准备)
    // Act (执行)
    // Assert (断言)
  });

  it('应该正确处理边界情况', () => {});
  it('应该正确处理错误情况', () => {});
});
```

### 2.2 集成测试

#### 2.2.1 API 集成测试

**强制要求**:

1. **所有 API 端点必须有集成测试**
2. **测试覆盖场景**:
   - 正常请求和响应
   - 认证失败 (401)
   - 权限不足 (403)
   - 资源不存在 (404)
   - 服务器错误 (500)
   - 网络超时

**测试示例**:

```javascript
describe('API Integration - User Login', () => {
  it('登录成功应返回用户信息和 token', async () => {
    const response = await post('/api/login', {
      username: 'test',
      password: 'test123'
    });

    expect(response).toHaveProperty('userId');
    expect(response).toHaveProperty('username');
    expect(response).toHaveProperty('apiKey');
  });

  it('登录失败应抛出错误', async () => {
    await expect(
      post('/api/login', { username: 'test', password: 'wrong' })
    ).rejects.toThrow();
  });
});
```

#### 2.2.2 组件集成测试

**强制要求**:

1. **关键用户流程必须有集成测试**:
   - 登录流程
   - 发送消息流程
   - 历史记录加载流程

2. **测试工具**: 使用 `@vue/test-utils` 和 Vitest

### 2.3 端到端测试 (E2E)

#### 2.3.1 E2E 测试范围

**强制要求**:

1. **核心用户路径**:
   - 用户注册 → 登录 → 发送消息 → 查看回复
   - 用户登录 → 查看历史 → 选择历史对话
   - 用户登录 → 设置 → 修改配置

2. **跨浏览器测试**:
   - Chrome (最新版)
   - Firefox (最新版)
   - Safari (最新版)
   - Edge (最新版)

3. **响应式测试**:
   - 移动端 (375px × 667px - iPhone SE)
   - 平板 (768px × 1024px - iPad)
   - 桌面端 (1920px × 1080px)

#### 2.3.2 E2E 测试工具

**推荐使用**: Playwright 或 Cypress

**测试频率**:

- 每次 PR 合并前: 运行冒烟测试
- 每日构建: 运行完整 E2E 测试套件
- 发版前: 运行完整测试 + 回归测试

---

## 第三章 用户体验一致性

### 3.1 交互模式标准

#### 3.1.1 按钮交互

**强制要求**:

1. **按钮状态**:
   - 默认 (default)
   - 悬停 (hover) - 视觉反馈明显
   - 激活 (active) - 点击时有按下效果
   - 禁用 (disabled) - 不透明度 0.5，禁止点击
   - 加载中 (loading) - 显示加载动画

2. **按钮尺寸**:
   - 小按钮 (small): 最小 32px × 32px
   - 中等按钮 (medium): 最小 40px × 40px
   - 大按钮 (large): 最小 48px × 48px

3. **点击反馈**:
   - 必须有视觉反馈 (缩放、颜色变化或波纹效果)
   - 响应时间 < 100ms

#### 3.1.2 表单交互

**强制要求**:

1. **输入验证**:
   - 实时验证 (输入时)
   - 失焦验证 (blur)
   - 提交前验证 (submit)

2. **错误提示**:
   - 位置: 输入框下方
   - 颜色: 红色 (`var(--n-color-error)`)
   - 图标: 错误图标
   - 内容: 具体说明错误原因

3. **成功提示**:
   - Toast 通知，显示 2-3 秒
   - 位置: 屏幕顶部居中或右上角

#### 3.1.3 加载状态

**强制要求**:

1. **加载指示器**:
   - 页面级加载: 全屏 Skeleton 或 Spinner
   - 组件级加载: 局部 Spinner
   - 数据加载: 列表项 Skeleton

2. **加载时机**:
   - API 请求 > 500ms: 必须显示加载状态
   - API 请求 < 500ms: 可选显示加载状态

3. **超时处理**:
   - 默认超时: 30 秒
   - 超时后显示: 错误提示 + 重试按钮

### 3.2 组件风格一致性

#### 3.2.1 Naive UI 组件规范

**强制要求**:

1. **统一使用 Naive UI 组件**:
   ```javascript
   // ✅ 正确
   import { NButton, NInput, NMessage } from 'naive-ui';

   // ❌ 错误 - 不要自己实现已有组件
   <button class="custom-button">...</button>
   ```

2. **组件主题配置**:
   - 使用 `NConfigProvider` 全局配置
   - 支持 light / dark 主题
   - 主题切换平滑过渡 (transition: 0.3s)

#### 3.2.2 图标使用规范

**强制要求**:

1. **图标大小**:
   - 小图标: 16px × 16px
   - 中等图标: 20px × 20px
   - 大图标: 24px × 24px

2. **图标颜色**:
   - 继承文本颜色: `currentColor`
   - 或使用主题变量: `var(--n-text-color)`

3. **图标库**:
   - 优先使用: `@vicons/fluent` 或 `@vicons/ionicons5`
   - 统一风格: 不混用多个图标库

### 3.3 无障碍性 (Accessibility)

#### 3.3.1 键盘导航

**强制要求**:

1. **Tab 顺序**: 所有可交互元素必须支持 Tab 导航
2. **焦点指示器**: 必须有明显的焦点样式
   ```css
   :focus-visible {
     outline: 2px solid var(--n-color-primary);
     outline-offset: 2px;
   }
   ```

3. **快捷键支持**:
   - `Ctrl/Cmd + Enter`: 发送消息
   - `Esc`: 关闭对话框/抽屉
   - `Ctrl/Cmd + K`: 打开搜索

#### 3.3.2 语义化 HTML

**强制要求**:

```html
<!-- ✅ 正确 -->
<nav aria-label="主导航">
  <ul>
    <li><a href="/home">首页</a></li>
  </ul>
</nav>

<button aria-label="关闭侧边栏" @click="close">
  <n-icon><CloseIcon /></n-icon>
</button>

<!-- ❌ 错误 -->
<div class="nav">
  <div class="nav-item">首页</div>
</div>

<div @click="close">
  <n-icon><CloseIcon /></n-icon>
</div>
```

#### 3.3.3 ARIA 属性

**强制要求**:

1. **按钮和链接**: 必须有 `aria-label` 或明确的文本内容
2. **动态内容**: 使用 `aria-live` 通知屏幕阅读器
3. **表单**: 使用 `aria-describedby` 关联错误提示

### 3.4 多终端一致性

#### 3.4.1 响应式设计检查清单

**强制要求**:

- [ ] 移动端 (< 768px) 显示正常
- [ ] 平板 (768px - 1024px) 显示正常
- [ ] 桌面端 (> 1024px) 显示正常
- [ ] 横屏模式显示正常
- [ ] 字体大小适配不同屏幕
- [ ] 触摸目标 ≥ 44px × 44px (移动端)
- [ ] 不出现横向滚动条

#### 3.4.2 移动端特殊优化

**强制要求**:

1. **触摸优化**:
   - 按钮最小尺寸: 44px × 44px
   - 间距: 至少 8px
   - 禁用长按选择: `user-select: none` (按钮)

2. **虚拟键盘适配**:
   - 输入框聚焦时页面不错位
   - 使用 `viewport-fit=cover` 适配安全区

3. **手势支持**:
   - 抽屉支持滑动关闭
   - 列表支持下拉刷新

---

## 第四章 性能要求

### 4.1 首屏加载性能

#### 4.1.1 性能指标

**强制要求**:

| 指标 | 优秀 | 良好 | 需优化 |
|------|------|------|--------|
| FCP (首次内容绘制) | < 1.0s | 1.0s - 2.5s | > 2.5s |
| LCP (最大内容绘制) | < 2.0s | 2.0s - 4.0s | > 4.0s |
| FID (首次输入延迟) | < 100ms | 100ms - 300ms | > 300ms |
| CLS (累积布局偏移) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTI (可交互时间) | < 3.0s | 3.0s - 5.0s | > 5.0s |

**测量工具**:

- Lighthouse (Chrome DevTools)
- WebPageTest
- 真实设备测试

#### 4.1.2 资源优化

**强制要求**:

1. **代码分割**:
   ```javascript
   // 路由懒加载
   const HomeView = () => import('@/views/HomeView.vue');
   const SettingsView = () => import('@/views/SettingsView.vue');

   // 组件懒加载
   const HeavyComponent = defineAsyncComponent(() =>
     import('@/components/HeavyComponent.vue')
   );
   ```

2. **资源压缩**:
   - JavaScript: Gzip 或 Brotli 压缩
   - CSS: 压缩并合并
   - 图片: WebP 格式，压缩率 80%
   - 字体: 仅加载使用的字符子集

3. **Bundle 大小限制**:
   - Vendor Bundle: < 200 KB (gzipped)
   - 单个路由 Bundle: < 100 KB (gzipped)
   - 首屏 JS 总大小: < 300 KB (gzipped)

#### 4.1.3 缓存策略

**强制要求**:

1. **浏览器缓存**:
   ```
   # 静态资源
   Cache-Control: public, max-age=31536000, immutable

   # HTML
   Cache-Control: no-cache

   # API 响应
   Cache-Control: no-store
   ```

2. **Service Worker 缓存**:
   - 缓存静态资源 (JS, CSS, 字体)
   - 缓存 API 响应 (可选，根据业务需求)

3. **LocalStorage/SessionStorage**:
   - 用户设置: LocalStorage
   - 临时数据: SessionStorage
   - 总大小: < 5 MB

### 4.2 运行时性能

#### 4.2.1 交互响应时间

**强制要求**:

| 操作类型 | 响应时间 | 说明 |
|---------|---------|------|
| 按钮点击 | < 100ms | 从点击到视觉反馈 |
| 输入响应 | < 50ms | 输入框输入到显示 |
| 页面切换 | < 300ms | 路由跳转到新页面渲染 |
| API 响应 | < 2000ms | 普通 API 请求 |
| 消息发送 | < 1000ms | 消息显示到发送确认 |

#### 4.2.2 内存管理

**强制要求**:

1. **内存占用限制**:
   - 首屏加载后: < 50 MB
   - 正常使用 30 分钟: < 150 MB
   - 内存增长率: < 2 MB/分钟

2. **内存泄漏防范**:
   ```javascript
   // ✅ 正确 - 清理事件监听器
   onMounted(() => {
     window.addEventListener('resize', handleResize);
   });

   onUnmounted(() => {
     window.removeEventListener('resize', handleResize);
   });

   // ✅ 正确 - 清理定时器
   const timer = setInterval(() => {}, 1000);
   onUnmounted(() => clearInterval(timer));

   // ✅ 正确 - 关闭 EventSource
   onUnmounted(() => {
     if (eventSource) eventSource.close();
   });
   ```

3. **长列表优化**:
   - 使用虚拟滚动 (Virtua)
   - 单页最多显示: 100 条消息
   - 超过时: 分页或虚拟滚动

#### 4.2.3 动画性能

**强制要求**:

1. **使用 CSS Transform 和 Opacity**:
   ```css
   /* ✅ 正确 - 使用 GPU 加速 */
   .element {
     transform: translateX(100px);
     opacity: 0.5;
     transition: transform 0.3s, opacity 0.3s;
   }

   /* ❌ 错误 - 触发重排 */
   .element {
     left: 100px;
     width: 200px;
     transition: left 0.3s, width 0.3s;
   }
   ```

2. **动画帧率**: ≥ 60 FPS
3. **动画时长**:
   - 微交互: 100ms - 200ms
   - 过渡动画: 200ms - 400ms
   - 复杂动画: 400ms - 600ms

### 4.3 网络性能

#### 4.3.1 请求数量限制

**强制要求**:

1. **首屏请求数**: < 20 个
2. **同时并发请求**: < 6 个 (HTTP/1.1) 或 < 100 个 (HTTP/2)
3. **轮询间隔**: ≥ 5 秒

#### 4.3.2 API 优化

**强制要求**:

1. **请求合并**:
   - 合并多个小请求为一个请求
   - 使用 GraphQL 或 批量 API

2. **分页加载**:
   ```javascript
   // 历史记录分页
   const PAGE_SIZE = 20;
   loadHistory({ page: 1, pageSize: PAGE_SIZE });
   ```

3. **请求取消**:
   ```javascript
   // 使用 AbortController 取消请求
   const controller = new AbortController();
   axios.get('/api/data', { signal: controller.signal });
   // 取消请求
   controller.abort();
   ```

#### 4.3.3 数据传输优化

**强制要求**:

1. **响应压缩**: 启用 Gzip 或 Brotli
2. **传输格式**:
   - API 响应: JSON (压缩后)
   - 大数据: 使用流式传输 (SSE)
3. **数据缓存**: 使用 Cache-Control 头

---

## 第五章 安全规范

### 5.1 XSS 防护

**强制要求**:

1. **内容渲染**:
   ```javascript
   // ✅ 正确 - 使用 DOMPurify 清理
   import DOMPurify from 'dompurify';
   const safeHTML = DOMPurify.sanitize(userInput);

   // ❌ 错误 - 直接使用 v-html
   <div v-html="userInput"></div>
   ```

2. **CSP (内容安全策略)**:
   ```
   Content-Security-Policy:
     default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: https:;
     connect-src 'self' https://api.example.com;
   ```

### 5.2 CSRF 防护

**强制要求**:

1. **使用 CSRF Token**: 所有状态变更请求必须包含 CSRF Token
2. **SameSite Cookie**: `SameSite=Strict` 或 `SameSite=Lax`

### 5.3 敏感数据保护

**强制要求**:

1. **不在前端存储敏感数据**:
   - ❌ 禁止: 密码、信用卡信息
   - ✅ 允许: 用户 ID、用户名、非敏感设置

2. **API Key 保护**:
   ```javascript
   // ✅ 正确 - 存储在 localStorage 并加密传输
   localStorage.setItem('apiKey', encryptedKey);

   // ❌ 错误 - 明文存储或暴露在代码中
   const apiKey = 'sk-1234567890abcdef';
   ```

3. **HTTPS Only**: 生产环境必须使用 HTTPS

---

## 第六章 文档规范

### 6.1 代码注释

**强制要求**:

1. **文件头注释**:
   ```javascript
   /**
    * @file ChatHeader.vue
    * @description 聊天界面顶部导航栏组件
    * @author 团队成员名
    * @date 2025-01-01
    */
   ```

2. **函数注释**: 所有导出函数必须有 JSDoc 注释
3. **复杂逻辑注释**: 超过 10 行的复杂逻辑必须添加说明注释

### 6.2 项目文档

**强制要求**:

1. **README.md**: 必须包含
   - 项目简介
   - 快速开始
   - 开发指南
   - 部署指南

2. **CLAUDE.md**: 项目架构和开发规范
3. **CHANGELOG.md**: 版本更新日志
4. **API.md**: API 接口文档

### 6.3 组件文档

**强制要求**:

对于可复用组件，必须在组件文件中或单独的 `.md` 文件中提供:

1. Props 说明
2. Events 说明
3. Slots 说明
4. 使用示例

---

## 第七章 版本控制规范

### 7.1 Git Commit 规范

**强制要求**:

使用 Conventional Commits 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整 (不影响功能)
- `refactor`: 重构 (不是新功能也不是 Bug 修复)
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

**示例**:

```
feat(chat): 添加消息打字效果

- 实现逐字显示消息内容
- 支持自定义打字速度
- 添加停止生成时清空打字队列

Closes #123
```

### 7.2 分支管理

**强制要求**:

1. **主分支**: `main` 或 `master` - 仅包含可发布的稳定代码
2. **开发分支**: `develop` - 最新的开发进度
3. **功能分支**: `feature/功能名` - 新功能开发
4. **修复分支**: `fix/bug名` - Bug 修复
5. **发布分支**: `release/版本号` - 发布准备

### 7.3 Pull Request 规范

**强制要求**:

1. **PR 标题**: 遵循 Commit 规范
2. **PR 描述**: 必须包含
   - 改动内容说明
   - 相关 Issue 编号
   - 测试说明
   - 截图 (UI 改动)

3. **代码审查**:
   - 至少 1 人 Approve
   - 所有讨论必须解决
   - CI 检查必须通过

---

## 附录 A: 自动化检查工具配置

### A.1 ESLint 配置增强

```javascript
// eslint.config.js
export default [
  // ... 现有配置
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
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],

      // Vue 特定
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-unused-vars': 'error',
    }
  }
];
```

### A.2 性能预算配置

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['naive-ui'],
        }
      }
    },
    chunkSizeWarningLimit: 500, // KB
  }
};
```

### A.3 GitHub Actions CI 配置

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

      # 性能预算检查
      - run: npm run lighthouse-ci
```

---

## 附录 B: 检查清单

### B.1 代码提交前检查清单

- [ ] 代码通过 ESLint 检查 (`npm run lint`)
- [ ] 代码通过 Prettier 格式化 (`npm run format`)
- [ ] 所有测试通过 (`npm run test`)
- [ ] 无 console.log / debugger
- [ ] 添加必要的注释
- [ ] 更新相关文档

### B.2 发布前检查清单

- [ ] 所有测试通过 (单元 + 集成 + E2E)
- [ ] 性能指标达标 (Lighthouse 分数 > 90)
- [ ] 跨浏览器测试通过
- [ ] 响应式设计测试通过
- [ ] 无障碍性测试通过 (WCAG 2.1 AA)
- [ ] 安全扫描通过
- [ ] 更新 CHANGELOG.md

---

## 修订历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| v1.0.0 | 2025-01-01 | 初始版本 | Claude Code |

---

**本宪法的最终解释权归项目维护团队所有。**
