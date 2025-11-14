<template>
	<div class="home-view" :class="{ 'dark-theme': themeStore.isDark }">
		<ChatHeader
			:is-desktop="isDesktop"
			:is-dark="themeStore.isDark"
			:show-sidebar="showHistorySidebar"
			@toggle-history="handleToggleHistory"
			@new-chat="handleNewChat"
			@toggle-theme="handleToggleTheme"
			@go-settings="handleGoSettings"
			@logout="handleLogout"
		/>

		<div class="chat-content">
			<HistorySidebar
				v-if="isDesktop && showHistorySidebar"
				:history-list="historyTasks"
				:active-id="currentTaskId"
				:loading="historyLoading"
				@select="loadHistoryConversation"
				@delete="confirmDeleteHistory"
				@close="showHistorySidebar = false"
			/>

			<div class="chat-main">
				<div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
					<!-- 空状态 -->
					<div v-if="conversationHistory.length === 0" class="empty-state">
						<div class="empty-icon">💬</div>
						<h2 class="empty-title">开始对话</h2>
						<p class="empty-subtitle">向我提问任何问题，我会尽力帮助你</p>
					</div>

					<!-- 消息列表 -->
					<div
						v-for="(msg, index) in conversationHistory"
						:key="index"
						class="message-wrapper"
					>
						<div v-if="msg.role === 'user'" class="user-message">
							<div class="message-content" v-html="safeMarkdown(msg.content)"></div>
						</div>

						<div v-else-if="msg.role === 'assistant'" class="assistant-message">
							<div class="message-content">
								<n-collapse v-if="msg.reasoning" class="reasoning-section">
									<n-collapse-item title="💭 思考过程" name="reasoning">
										<div class="reasoning-content" v-html="safeMarkdown(msg.reasoning)"></div>
									</n-collapse-item>
								</n-collapse>
								<div class="answer-content" v-html="safeMarkdown(msg.content)"></div>
								<div v-if="msg.isGenerating" class="typing-indicator">
									<span></span>
									<span></span>
									<span></span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<ChatInput
					v-model="content"
					:is-generating="isGenerating"
					:disabled="!userStore.isLoggedIn"
					:enable-upload="false"
					@send="sendMessage"
					@stop="stopGeneration"
					@clear="clearConversation"
				/>
			</div>
		</div>

		<n-drawer v-model:show="showHistoryDrawer" placement="left" width="85%">
			<n-drawer-content title="聊天历史">
				<HistorySidebar
					:history-list="historyTasks"
					:active-id="currentTaskId"
					:loading="historyLoading"
					@select="loadHistoryConversation"
					@delete="confirmDeleteHistory"
					@close="showHistoryDrawer = false"
				/>
			</n-drawer-content>
		</n-drawer>
	</div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, useDialog, NCollapse, NCollapseItem, NDrawer, NDrawerContent } from 'naive-ui';
import { useUserStore, useThemeStore, useChatStore } from '@/stores';
import { ChatHeader, ChatInput, HistorySidebar } from '@/components/chat';
import { safeMarkdown } from '@/utils/markdown';
import { get, post, del } from '@/utils/request';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const userStore = useUserStore();
const themeStore = useThemeStore();
const chatStore = useChatStore();

// UI状态
const isDesktop = ref(window.innerWidth >= 768);
const showHistorySidebar = ref(true);
const showHistoryDrawer = ref(false);
const messagesContainer = ref(null);
const isUserScrolling = ref(false); // 标记用户是否主动滚动

// 对话状态
const content = ref('');
const conversationHistory = ref([]);
const currentTaskId = ref(null);
const isGenerating = ref(false);

// SSE相关
let currentEvtSource = null;
let isNormalClosure = false;

// 打字效果控制
const loadTypingSpeed = () => {
	const saved = localStorage.getItem('typingSpeed');
	return saved !== null ? parseInt(saved) : 30;
};
const typingSpeed = ref(loadTypingSpeed()); // 从localStorage加载,默认30ms每字符
let typingQueue = [];
let typingTimer = null;
let isTyping = false;

// 历史记录
const historyTasks = ref([]);
const historyLoading = ref(false);

const formatHistoryTasks = (data) => {
	const tasksArray = Array.isArray(data) ? data : data?.tasks || [];
	return tasksArray.map(task => ({
		id: task.taskId || task.id,
		title: task.title || task.firstMessage || '未命名对话',
		messageCount: task.messageCount || 0,
		timestamp: task.lastActivity || task.startTime || task.updatedAt,
	}));
};

// 检查是否在底部（允许一定误差）
const isAtBottom = () => {
	if (!messagesContainer.value) return true;
	const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
	const threshold = 100; // 距离底部100px内视为在底部
	return scrollHeight - scrollTop - clientHeight < threshold;
};

// 滚动到底部
const scrollToBottom = (force = false) => {
	nextTick(() => {
		if (messagesContainer.value) {
			// 如果是强制滚动，或者用户没有主动滚动且已经在底部附近，才自动滚动
			if (force || (!isUserScrolling.value && isAtBottom())) {
				messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
			}
		}
	});
};

// 监听用户滚动行为
const handleScroll = () => {
	if (!messagesContainer.value) return;

	// 检查用户是否在底部
	if (isAtBottom()) {
		// 如果滚动到底部，允许自动滚动
		isUserScrolling.value = false;
	} else {
		// 如果不在底部，说明用户主动向上滚动了
		isUserScrolling.value = true;
	}
};

// 发送消息
const sendMessage = async () => {
	if (!content.value.trim() || isGenerating.value) return;

	conversationHistory.value.push({
		role: 'user',
		content: content.value,
	});

	// 用户发送消息时，强制滚动到底部并重置滚动状态
	isUserScrolling.value = false;
	scrollToBottom(true);

	try {
		let taskId;
		if (!currentTaskId.value) {
			const result = await post('/start', {
				content: content.value,
				userId: userStore.userId,
			});
			taskId = result.taskId;
			currentTaskId.value = taskId;
		} else {
			taskId = currentTaskId.value;
			await post('/continue', {
				taskId,
				content: content.value,
			});
		}

		content.value = '';
		doSSE(taskId);
	} catch (error) {
		console.error('发送消息失败:', error);
		message.error(error.message || '发送失败');
	}
};

// SSE连接
const ensureAssistantMessage = () => {
	const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
	if (!lastMsg || lastMsg.role !== 'assistant') {
		conversationHistory.value.push({
			role: 'assistant',
			reasoning: '',
			content: '',
			isGenerating: true,
		});
		return conversationHistory.value[conversationHistory.value.length - 1];
	}
	return lastMsg;
};

const decodeChunk = (chunk = '') => {
	try {
		return decodeURIComponent(chunk);
	} catch {
		return chunk;
	}
};

// 打字效果处理
const processTypingQueue = () => {
	if (isTyping || typingQueue.length === 0) return;

	isTyping = true;
	const processNext = () => {
		if (typingQueue.length === 0) {
			isTyping = false;
			return;
		}

		const { type, text } = typingQueue.shift();
		const msg = ensureAssistantMessage();

		if (type === 'reasoning') {
			msg.reasoning = (msg.reasoning || '') + text;
		} else {
			msg.content = (msg.content || '') + text;
		}

		scrollToBottom();

		// 根据配置的速度继续处理下一个字符
		if (typingQueue.length > 0) {
			typingTimer = setTimeout(processNext, typingSpeed.value);
		} else {
			isTyping = false;
		}
	};

	processNext();
};

const appendReasoning = (text = '') => {
	// 将文本拆分为单个字符并加入队列
	for (const char of text) {
		typingQueue.push({ type: 'reasoning', text: char });
	}
	processTypingQueue();
};

const appendContent = (text = '') => {
	// 将文本拆分为单个字符并加入队列
	for (const char of text) {
		typingQueue.push({ type: 'content', text: char });
	}
	processTypingQueue();
};

const doSSE = (taskId) => {
	isGenerating.value = true;
	isNormalClosure = false;

	const url = `/api/events?taskId=${taskId}&userId=${userStore.userId}`;
	currentEvtSource = new EventSource(url);
	let hasCompleted = false;

	let timeoutId = setTimeout(() => {
		console.log('EventSource连接超时');
		closeEventSource();
	}, 180000);

	const closeEventSource = () => {
		if (!currentEvtSource) return;
		try {
			clearTimeout(timeoutId);
			currentEvtSource.close();
			currentEvtSource = null;
			isGenerating.value = false;
		} catch (e) {
			console.error('关闭EventSource失败:', e);
		}
	};

	const markResponseFinished = (showToast = true) => {
		if (hasCompleted) return;
		hasCompleted = true;
		isNormalClosure = true;
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (lastMsg) {
			lastMsg.isGenerating = false;
		}
		closeEventSource();
		if (showToast) {
			message.success('回复完成');
		}
	};

	const handleLegacyPayload = (rawData = '') => {
		if (!rawData) return;

		const trimmed = rawData.trim();
		const normalized = trimmed.toLowerCase();
		const isPlainDone = normalized === '[done]';
		const isPrefixedDone = normalized.startsWith('[done]');
		const isStatusCompleted =
			rawData.includes('"status":"completed"') || rawData.includes('"status": "completed"');

		if (rawData === '[DONE]' || isPlainDone || isPrefixedDone || isStatusCompleted) {
			markResponseFinished(true);
			return;
		}

		if (rawData.startsWith('[reasoning]')) {
			appendReasoning(decodeChunk(rawData.replace('[reasoning]', '')));
			return;
		}

		if (rawData.startsWith('[result]')) {
			appendContent(decodeChunk(rawData.replace('[result]', '')));
			return;
		}

		if (rawData.startsWith('[error]')) {
			const errorMsg = decodeChunk(rawData.replace('[error]', '')) || 'AI响应出错';
			appendContent(`\n\n**[错误]** ${errorMsg}`);
			message.error(errorMsg);
			markResponseFinished(false);
			return;
		}

		// Try JSON fallback if backend returns structured message without explicit event name
		try {
			const data = JSON.parse(rawData);
			if (data?.type === 'reasoning' || data?.reasoning) {
				appendReasoning(data.reasoning || data.chunk || '');
			} else if (data?.type === 'content' || data?.content) {
				appendContent(data.content || data.chunk || '');
			} else if (data?.status === 'completed') {
				markResponseFinished(true);
			} else if (data?.error) {
				appendContent(`\n\n**[错误]** ${data.error}`);
				message.error(data.error);
				markResponseFinished(false);
			}
		} catch {
			// Ignore parsing errors for unknown payloads
		}
	};

	currentEvtSource.addEventListener('reasoning', (e) => {
		try {
			const data = JSON.parse(e.data);
			appendReasoning(data.reasoning || data.chunk || '');
		} catch {
			appendReasoning(e.data || '');
		}
	});

	currentEvtSource.addEventListener('content', (e) => {
		try {
			const data = JSON.parse(e.data);
			appendContent(data.content || data.chunk || '');
		} catch {
			appendContent(e.data || '');
		}
	});

	currentEvtSource.addEventListener('done', () => {
		markResponseFinished(true);
	});

	currentEvtSource.onmessage = (e) => {
		handleLegacyPayload(e?.data);
	};

	currentEvtSource.onerror = (e) => {
		if (!isNormalClosure) {
			console.error('SSE错误:', e);
			message.error('连接出错');
		}
		closeEventSource();
	};
};

// 清理打字队列
const clearTypingQueue = () => {
	if (typingTimer) {
		clearTimeout(typingTimer);
		typingTimer = null;
	}
	typingQueue = [];
	isTyping = false;
};

// 停止生成
const stopGeneration = async () => {
	if (!currentTaskId.value || !isGenerating.value) {
		return;
	}

	try {
		// 调用后端停止API
		await post(`/stop/${currentTaskId.value}`);

		// 关闭EventSource连接
		if (currentEvtSource) {
			isNormalClosure = true;
			currentEvtSource.close();
			currentEvtSource = null;
		}

		// 清空打字队列,立即显示剩余内容
		clearTypingQueue();

		// 更新UI状态
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (lastMsg && lastMsg.role === 'assistant') {
			lastMsg.content += '\n\n*[用户已停止生成]*';
			lastMsg.isGenerating = false;
		}

		isGenerating.value = false;
		message.info('已停止生成');
	} catch (error) {
		console.error('停止生成失败:', error);
		message.error(error.message || '停止失败');

		// 即使API调用失败,也尝试关闭本地连接
		if (currentEvtSource) {
			isNormalClosure = true;
			currentEvtSource.close();
			currentEvtSource = null;
		}
		clearTypingQueue();
		isGenerating.value = false;
	}
};

// 清空对话
const clearConversation = () => {
	dialog.warning({
		title: '确认清空',
		content: '确定要清空当前对话吗？',
		positiveText: '确定',
		negativeText: '取消',
		onPositiveClick: () => {
			conversationHistory.value = [];
			currentTaskId.value = null;
			message.success('已清空对话');
		},
	});
};

// 加载历史记录
	const loadHistory = async () => {
		historyLoading.value = true;
		try {
			const result = await get(`/history?userId=${userStore.userId}`);
			historyTasks.value = formatHistoryTasks(result);
		} catch (error) {
			console.error('加载历史失败:', error);
		} finally {
			historyLoading.value = false;
		}
};

// 加载历史对话
const loadHistoryConversation = async (taskId) => {
	try {
		const result = await get(`/history/${taskId}?userId=${userStore.userId}`);
		conversationHistory.value = result.messages || [];
		currentTaskId.value = taskId;
		showHistoryDrawer.value = false;
		// 加载历史对话时强制滚动到底部
		isUserScrolling.value = false;
		scrollToBottom(true);
	} catch (error) {
		console.error('加载对话失败:', error);
		message.error('加载失败');
	}
};

// 删除历史
const confirmDeleteHistory = (taskId) => {
	dialog.warning({
		title: '确认删除',
		content: '确定要删除这条历史记录吗？',
		positiveText: '确定',
		negativeText: '取消',
		onPositiveClick: async () => {
			try {
				await del(`/history/${taskId}?userId=${userStore.userId}`);
				historyTasks.value = historyTasks.value.filter(t => t.id !== taskId);
				message.success('删除成功');
			} catch (error) {
				console.error('删除失败:', error);
				message.error('删除失败');
			}
		},
	});
};

// 切换历史记录
const handleToggleHistory = () => {
	if (isDesktop.value) {
		showHistorySidebar.value = !showHistorySidebar.value;
	} else {
		showHistoryDrawer.value = !showHistoryDrawer.value;
	}
};

// 开始新对话
const handleNewChat = () => {
	if (conversationHistory.value.length > 0) {
		dialog.warning({
			title: '开始新对话',
			content: '当前对话尚未保存到历史记录，是否继续？',
			positiveText: '继续',
			negativeText: '取消',
			onPositiveClick: () => {
				conversationHistory.value = [];
				currentTaskId.value = null;
				chatStore.startNewChat();
				message.success('已开始新对话');
			},
		});
	} else {
		chatStore.startNewChat();
		message.success('已开始新对话');
	}
};

// 主题切换
const handleToggleTheme = () => {
	console.log('主题切换按钮点击 - 当前isDark:', themeStore.isDark);
	themeStore.toggleTheme();
	console.log('主题切换后 - 新的isDark:', themeStore.isDark);
};

// 跳转设置页
const handleGoSettings = () => {
	console.log('设置按钮点击');
	router.push('/settings');
};

// 退出登录
const handleLogout = () => {
	console.log('退出登录按钮点击');

	// 清空当前对话记录
	conversationHistory.value = [];
	currentTaskId.value = null;

	// 清空聊天 store
	chatStore.startNewChat();

	// 执行登出
	userStore.logout();
	router.push('/login');
};

// 响应式监听
const handleResize = () => {
	isDesktop.value = window.innerWidth >= 768;
};

onMounted(() => {
	window.addEventListener('resize', handleResize);
	loadHistory();

	// 恢复上次的会话
	const restored = chatStore.restoreSession();
	if (restored) {
		// 从 chatStore 恢复消息到 conversationHistory
		conversationHistory.value = chatStore.messages;
		currentTaskId.value = chatStore.currentSessionId;
		isUserScrolling.value = false;
		scrollToBottom(true);
	}
});

// 监听消息变化，自动保存到 localStorage
watch(
	() => conversationHistory.value,
	() => {
		if (conversationHistory.value.length > 0) {
			// 同步到 chatStore
			chatStore.messages = conversationHistory.value;
			chatStore.currentSessionId = currentTaskId.value;
			// 保存到 localStorage
			chatStore.saveCurrentSession();
		}
	},
	{ deep: true }
);

onUnmounted(() => {
	window.removeEventListener('resize', handleResize);
	if (currentEvtSource) {
		currentEvtSource.close();
	}
	clearTypingQueue();
});
</script>

<style scoped>
.home-view {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: var(--n-color-body);
}

.chat-content {
	flex: 1;
	display: flex;
	overflow: hidden;
}

.chat-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.messages-container {
	flex: 1;
	overflow-y: auto;
	padding: 20px;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	text-align: center;
	padding: 40px 20px;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 16px;
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}

.empty-title {
	font-size: 24px;
	font-weight: 600;
	color: var(--n-text-color);
	margin: 0 0 8px 0;
}

.empty-subtitle {
	font-size: 16px;
	color: var(--n-text-color-disabled);
	margin: 0;
}

.message-wrapper {
	margin-bottom: 20px;
	animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.user-message {
	display: flex;
	justify-content: flex-end;
}

.user-message .message-content {
	max-width: 70%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 12px 16px;
	border-radius: 18px 18px 4px 18px;
	box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	overflow-wrap: break-word;
	word-wrap: break-word;
	word-break: break-word;
}

.user-message .message-content :deep(pre),
.user-message .message-content :deep(code),
.user-message .message-content :deep(table) {
	overflow-x: auto;
	max-width: 100%;
}

.assistant-message {
	display: flex;
	justify-content: flex-start;
}

.assistant-message .message-content {
	max-width: 85%;
	background: var(--n-color-card);
	padding: 16px;
	border-radius: 18px 18px 18px 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reasoning-section {
	margin-bottom: 12px;
	border-left: 3px solid #667eea;
	padding-left: 12px;
}

.reasoning-content {
	padding: 8px;
	background: rgba(102, 126, 234, 0.05);
	border-radius: 8px;
	font-size: 14px;
	overflow-wrap: break-word;
	word-wrap: break-word;
	word-break: break-word;
}

.reasoning-content :deep(pre),
.reasoning-content :deep(code),
.reasoning-content :deep(table) {
	overflow-x: auto;
	max-width: 100%;
}

.answer-content {
	line-height: 1.6;
	overflow-wrap: break-word;
	word-wrap: break-word;
	word-break: break-word;
}

/* Markdown 内容样式 - 处理表格和代码块溢出 */
.message-content :deep(pre) {
	overflow-x: auto;
	max-width: 100%;
	background: rgba(0, 0, 0, 0.05);
	padding: 12px;
	border-radius: 8px;
	margin: 8px 0;
}

.dark-theme .message-content :deep(pre) {
	background: rgba(255, 255, 255, 0.05);
}

.message-content :deep(code) {
	overflow-wrap: break-word;
	word-break: break-word;
}

.message-content :deep(pre code) {
	overflow-wrap: normal;
	word-break: normal;
	white-space: pre;
	display: block;
}

.message-content :deep(table) {
	display: block;
	overflow-x: auto;
	max-width: 100%;
	border-collapse: collapse;
	margin: 12px 0;
	border: 1px solid var(--n-border-color);
}

.message-content :deep(th),
.message-content :deep(td) {
	border: 1px solid var(--n-border-color);
	padding: 8px 12px;
	text-align: left;
	white-space: nowrap;
}

.message-content :deep(th) {
	background: var(--n-color-hover);
	font-weight: 600;
}

.message-content :deep(tr:nth-child(even)) {
	background: rgba(0, 0, 0, 0.02);
}

.dark-theme .message-content :deep(tr:nth-child(even)) {
	background: rgba(255, 255, 255, 0.02);
}

.message-content :deep(img) {
	max-width: 100%;
	height: auto;
	border-radius: 8px;
	margin: 8px 0;
}

.message-content :deep(blockquote) {
	border-left: 3px solid var(--n-border-color);
	padding-left: 12px;
	margin: 12px 0;
	color: var(--n-text-color-disabled);
	font-style: italic;
}

.typing-indicator {
	display: flex;
	gap: 4px;
	padding: 8px 0;
}

.typing-indicator span {
	width: 8px;
	height: 8px;
	background: #667eea;
	border-radius: 50%;
	animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
	animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
	animation-delay: 0.4s;
}

@keyframes typing {
	0%, 60%, 100% {
		transform: translateY(0);
		opacity: 0.5;
	}
	30% {
		transform: translateY(-10px);
		opacity: 1;
	}
}

.messages-container::-webkit-scrollbar {
	width: 6px;
}

.messages-container::-webkit-scrollbar-track {
	background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
	background: var(--n-scrollbar-color);
	border-radius: 3px;
}

@media (max-width: 768px) {
	.messages-container {
		padding: 12px;
	}

	.user-message .message-content,
	.assistant-message .message-content {
		max-width: 90%;
	}
}
</style>
