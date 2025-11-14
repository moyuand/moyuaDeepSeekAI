# 墨鱼AI智能助手 - 开发任务清单

> **最后更新**: 2025-01-14
> **项目版本**: v1.0.0

---

## 任务优先级说明

- **P0**: 核心功能，必须完成
- **P1**: 重要功能，应该完成
- **P2**: 增强功能，可选完成
- **P3**: 未来优化，计划中

## 任务状态说明

- ⬜ 待开始
- 🔄 进行中
- ✅ 已完成
- ❌ 已取消
- ⏸️ 已暂停

---

## 🆕 对话持久化功能 (P0)

> **功能描述**: 实现页面刷新时保持当前对话内容，并提供新对话按钮快速开始新话题
> **预计工时**: 2-3天
> **负责人**: 待分配
> **依赖**: Chat Store、HomeView、ChatHeader

### 1. Store层实现 (优先级: P0)

#### 1.1 Chat Store 持久化方法

- ⬜ **任务 #1.1.1**: 实现 `saveCurrentSession()` 方法
  - **描述**: 将当前会话（sessionId、messages、timestamp）保存到 localStorage
  - **文件**: `src/stores/chat.js`
  - **验收标准**:
    - 成功保存到 `localStorage['currentSession']`
    - 数据格式为 JSON 字符串
    - 包含 sessionId、messages、timestamp 三个字段
    - 集成日志记录（logger.debug）
  - **预计工时**: 30分钟

- ⬜ **任务 #1.1.2**: 实现 `restoreSession()` 方法
  - **描述**: 从 localStorage 恢复会话，带24小时过期检查
  - **文件**: `src/stores/chat.js`
  - **验收标准**:
    - 成功从 localStorage 读取并解析数据
    - 检查时间戳，超过24小时自动清除
    - 数据有效时恢复 currentSessionId 和 messages
    - JSON 解析错误时安全降级，清除无效数据
    - 返回布尔值表示恢复是否成功
    - 集成日志记录（info/error）
  - **预计工时**: 1小时

- ⬜ **任务 #1.1.3**: 实现 `clearPersistedSession()` 方法
  - **描述**: 清除 localStorage 中的会话数据
  - **文件**: `src/stores/chat.js`
  - **验收标准**:
    - 调用 `localStorage.removeItem('currentSession')`
    - 集成日志记录（logger.debug）
  - **预计工时**: 15分钟

- ⬜ **任务 #1.1.4**: 实现 `startNewChat()` 方法
  - **描述**: 清空当前对话并清除持久化数据
  - **文件**: `src/stores/chat.js`
  - **验收标准**:
    - 调用 `clearMessages()` 清空消息
    - 调用 `clearPersistedSession()` 清除持久化
    - 重置 currentSessionId 为 null
    - 集成日志记录（logger.info）
  - **预计工时**: 20分钟

### 2. HomeView 集成 (优先级: P0)

#### 2.1 会话恢复

- ⬜ **任务 #2.1.1**: 在 `onMounted` 中恢复会话
  - **描述**: 页面加载时自动调用 `restoreSession()`
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 在 `onMounted` 钩子中调用 `chatStore.restoreSession()`
    - 恢复成功后，UI 正确显示历史消息
    - 恢复失败时，显示空状态
  - **预计工时**: 30分钟

- ⬜ **任务 #2.1.2**: 添加消息变化监听（自动保存）
  - **描述**: 使用 watch 监听消息变化，自动保存到 localStorage
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 使用 `watch(() => chatStore.messages, ...)` 监听
    - 设置 `{ deep: true }` 深度监听
    - 仅在 messages.length > 0 时保存
    - 调用 `chatStore.saveCurrentSession()`
  - **预计工时**: 30分钟

- ⬜ **任务 #2.1.3**: 切换历史对话时清除持久化
  - **描述**: 点击历史记录项时，清除当前会话持久化
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 在 `loadHistoryDetail()` 方法中调用 `clearPersistedSession()`
    - 加载历史对话后，不会与当前持久化冲突
  - **预计工时**: 20分钟

### 3. ChatHeader 新对话按钮 (优先级: P0)

#### 3.1 UI 实现

- ⬜ **任务 #3.1.1**: 添加新对话按钮到 ChatHeader
  - **描述**: 在主题切换按钮左侧添加编辑图标按钮
  - **文件**: `src/components/chat/ChatHeader.vue`
  - **验收标准**:
    - 使用 `<n-button quaternary circle>` 样式
    - 图标使用编辑图标（SVG path）
    - 按钮位置：主题切换按钮左侧
    - 添加 `title` 属性显示快捷键提示
    - 绑定 `@click="$emit('new-chat')"`
  - **预计工时**: 30分钟

- ⬜ **任务 #3.1.2**: 响应式适配
  - **描述**: 确保移动端和桌面端都正确显示
  - **文件**: `src/components/chat/ChatHeader.vue`
  - **验收标准**:
    - 桌面端（≥768px）显示完整按钮
    - 移动端（<768px）按钮大小适配（44px × 44px）
    - 按钮间距合理
  - **预计工时**: 20分钟

#### 3.2 事件处理

- ⬜ **任务 #3.2.1**: 在 HomeView 中处理 `new-chat` 事件
  - **描述**: 实现新对话逻辑，带未保存消息确认
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 监听 `@new-chat` 事件
    - 检查 `chatStore.messageCount > 0` 判断是否有消息
    - 有消息时显示确认对话框（Naive UI dialog.warning）
    - 确认对话框包含"继续"和"取消"按钮
    - 点击"继续"后调用 `chatStore.startNewChat()`
    - 无消息时直接调用 `chatStore.startNewChat()`
  - **预计工时**: 1小时

- ⬜ **任务 #3.2.2**: 新对话后聚焦输入框
  - **描述**: 清空对话后自动聚焦到输入框
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 使用 `ref` 获取 ChatInput 组件引用
    - 调用 `inputRef.value?.focus()` 聚焦
    - 桌面端和移动端都能正确聚焦
  - **预计工时**: 20分钟

### 4. 快捷键支持 (优先级: P1)

- ⬜ **任务 #4.1**: 实现全局快捷键监听（Ctrl/Cmd+N）
  - **描述**: 按下 Ctrl+N 或 Cmd+N 触发新对话
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 使用 `@keydown` 或 `window.addEventListener` 监听
    - 检测 `event.ctrlKey || event.metaKey` 和 `event.key === 'n'`
    - 阻止浏览器默认行为（`event.preventDefault()`）
    - 调用与按钮点击相同的处理逻辑
    - 组件卸载时移除监听器
  - **预计工时**: 45分钟

### 5. 边界情况处理 (优先级: P1)

- ⬜ **任务 #5.1**: 处理 localStorage 存储空间限制
  - **描述**: 控制单个会话消息数量，避免超过5MB限制
  - **文件**: `src/stores/chat.js`
  - **验收标准**:
    - 在 `saveCurrentSession()` 中检查消息数量
    - 如果消息数 > 100，只保存最近100条
    - 添加警告日志（logger.warn）
  - **预计工时**: 30分钟

- ⬜ **任务 #5.2**: 处理无效 sessionId
  - **描述**: 恢复的 sessionId 在后端不存在时的降级处理
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 调用后端 API 验证 sessionId 是否有效（可选）
    - 无效时创建新会话
    - 清除无效的持久化数据
  - **预计工时**: 1小时

- ⬜ **任务 #5.3**: 多标签页数据同步说明
  - **描述**: 添加文档说明多标签页行为
  - **文件**: 项目文档
  - **验收标准**:
    - 在 README 或用户文档中说明
    - 不同标签页的 localStorage 独立
    - 用户在多个标签页操作时的预期行为
  - **预计工时**: 15分钟

### 6. 测试 (优先级: P0)

#### 6.1 单元测试

- ⬜ **任务 #6.1.1**: Chat Store 持久化方法单元测试
  - **描述**: 测试 saveCurrentSession、restoreSession、clearPersistedSession、startNewChat
  - **文件**: `tests/unit/stores/chat.spec.js`
  - **验收标准**:
    - 至少 8 个测试用例（参考 TECHNICAL_IMPLEMENTATION_PLAN.md）
    - 覆盖正常流程和异常流程
    - 覆盖过期数据、格式错误等边界情况
    - 测试覆盖率 > 80%
  - **预计工时**: 2小时

- ⬜ **任务 #6.1.2**: HomeView 集成测试
  - **描述**: 测试 HomeView 中的会话恢复和自动保存
  - **文件**: `tests/unit/views/HomeView.spec.js`
  - **验收标准**:
    - 测试 onMounted 时恢复会话
    - 测试消息变化时自动保存
    - 测试新对话按钮点击
    - Mock chatStore 方法
  - **预计工时**: 1.5小时

#### 6.2 E2E 测试

- ⬜ **任务 #6.2.1**: 刷新恢复功能 E2E 测试
  - **描述**: 自动化测试页面刷新后对话恢复
  - **文件**: `tests/e2e/session-persistence.spec.js`
  - **验收标准**:
    - 发送消息
    - 刷新页面
    - 验证消息仍然存在
    - 验证 sessionId 保持不变
  - **预计工时**: 1小时

- ⬜ **任务 #6.2.2**: 新对话按钮 E2E 测试
  - **描述**: 自动化测试新对话按钮功能
  - **文件**: `tests/e2e/new-chat-button.spec.js`
  - **验收标准**:
    - 发送消息
    - 点击新对话按钮
    - 验证确认对话框出现
    - 点击"继续"
    - 验证消息被清空
    - 验证 localStorage 被清除
  - **预计工时**: 1小时

- ⬜ **任务 #6.2.3**: 会话过期测试
  - **描述**: 测试24小时过期机制（使用 Mock 时间）
  - **文件**: `tests/e2e/session-expiry.spec.js`
  - **验收标准**:
    - 保存会话数据
    - Mock 时间为25小时后
    - 刷新页面
    - 验证会话未恢复
    - 验证 localStorage 被清除
  - **预计工时**: 1.5小时

#### 6.3 手动测试

- ⬜ **任务 #6.3.1**: 桌面端浏览器测试
  - **描述**: 在主流桌面浏览器测试功能
  - **验收标准**:
    - Chrome/Edge 测试通过
    - Firefox 测试通过
    - Safari 测试通过（macOS）
    - 所有功能正常，无控制台错误
  - **预计工时**: 1小时

- ⬜ **任务 #6.3.2**: 移动端浏览器测试
  - **描述**: 在移动设备测试功能
  - **验收标准**:
    - iOS Safari 测试通过
    - Android Chrome 测试通过
    - 按钮大小合适，易于点击
    - 快捷键在移动端正确禁用或降级
  - **预计工时**: 1小时

- ⬜ **任务 #6.3.3**: 用户体验测试
  - **描述**: 测试实际使用场景的用户体验
  - **验收标准**:
    - 刷新恢复无闪烁，平滑过渡
    - 新对话按钮位置合理，易于发现
    - 确认对话框文案清晰
    - 无意外的数据丢失
  - **预计工时**: 1小时

### 7. 文档与优化 (优先级: P2)

- ⬜ **任务 #7.1**: 更新用户文档
  - **描述**: 在用户手册中说明对话持久化功能
  - **文件**: `docs/user-guide.md`（如存在）
  - **验收标准**:
    - 说明刷新保持功能
    - 说明新对话按钮用法
    - 说明快捷键（Ctrl/Cmd+N）
    - 说明24小时过期机制
  - **预计工时**: 30分钟

- ⬜ **任务 #7.2**: 添加代码注释
  - **描述**: 为新增代码添加详细注释
  - **文件**: 所有涉及的文件
  - **验收标准**:
    - 关键方法有 JSDoc 注释
    - 复杂逻辑有行内注释
    - 边界情况处理有注释说明
  - **预计工时**: 45分钟

- ⬜ **任务 #7.3**: 性能优化
  - **描述**: 优化 watch 监听和 localStorage 写入性能
  - **文件**: `src/views/HomeView.vue`
  - **验收标准**:
    - 使用防抖（debounce）优化频繁保存
    - 避免不必要的深度监听
    - 测试大量消息时的性能表现
  - **预计工时**: 1小时

---

## 任务统计

### 对话持久化功能

- **总任务数**: 30个
- **预计总工时**: 约 20-22小时
- **待开始**: 30个 ⬜
- **进行中**: 0个 🔄
- **已完成**: 0个 ✅

### 优先级分布

- **P0 任务**: 22个（核心功能）
- **P1 任务**: 5个（重要增强）
- **P2 任务**: 3个（可选优化）

---

## 实施建议

### 推荐顺序

1. **第1天**: 完成 Store 层实现（任务 #1.1.1 - #1.1.4）+ 单元测试（任务 #6.1.1）
2. **第2天**: 完成 HomeView 集成（任务 #2.1.1 - #2.1.3）+ ChatHeader 按钮（任务 #3.1.1 - #3.2.2）
3. **第3天**: 完成快捷键支持（任务 #4.1）+ E2E 测试（任务 #6.2.1 - #6.2.3）+ 手动测试（任务 #6.3.1 - #6.3.3）
4. **第4天**: 边界情况处理（任务 #5.1 - #5.3）+ 文档与优化（任务 #7.1 - #7.3）

### 风险提示

1. **localStorage 兼容性**: 某些隐私模式下 localStorage 不可用，需要 try-catch 保护
2. **数据迁移**: 如果现有用户有旧的 localStorage 数据，需要考虑迁移或清理
3. **性能影响**: 频繁的 watch 触发可能影响性能，需要防抖优化

---

## 更新日志

- **2025-01-14**: 创建任务清单，包含对话持久化功能的所有实施任务
