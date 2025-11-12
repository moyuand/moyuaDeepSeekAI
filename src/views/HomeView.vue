<template>
	<div class="home-view">
		<ChatHeader
			:is-desktop="isDesktop"
			:is-dark="themeStore.isDark"
			:current-model="selectedModel"
			:model-options="modelOptions"
			@update:current-model="selectedModel = $event"
			@toggle-history="showHistorySidebar = !showHistorySidebar"
			@toggle-theme="themeStore.toggleTheme()"
			@go-settings="router.push('/settings')"
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
				<div ref="messagesContainer" class="messages-container">
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
					@send="sendMessage"
					@stop="stopGeneration"
					@clear="clearConversation"
					@upload="handleUpload"
					@remove-upload="handleRemoveUpload"
				/>
			</div>
		</div>

		<n-drawer v-model:show="showHistoryDrawer" placement="left" :width="280">
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, useDialog, NCollapse, NCollapseItem, NDrawer, NDrawerContent } from 'naive-ui';
import { useUserStore, useChatStore, useThemeStore } from '@/stores';
import { ChatHeader, ChatInput, HistorySidebar } from '@/components/chat';
import { safeMarkdown } from '@/utils/markdown';
import { get, post, del } from '@/utils/request';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const userStore = useUserStore();
const chatStore = useChatStore();
const themeStore = useThemeStore();

// UI状态
const isDesktop = ref(window.innerWidth >= 768);
const showHistorySidebar = ref(true);
const showHistoryDrawer = ref(false);
const messagesContainer = ref(null);

// 对话状态
const content = ref('');
const selectedModel = ref('deepseek-r1');
const conversationHistory = ref([]);
const currentTaskId = ref(null);
const isGenerating = ref(false);
const hasUploadedFile = ref(false);

// SSE相关
let currentEvtSource = null;
let isNormalClosure = false;

// 历史记录
const historyTasks = ref([]);
const historyLoading = ref(false);

// 模型选项
const modelOptions = [
	{ label: 'DeepSeek R1', value: 'deepseek-r1' },
	{ label: 'DeepSeek Chat', value: 'deepseek-chat' },
];

// 滚动到底部
const scrollToBottom = () => {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	});
};

// 发送消息
const sendMessage = async () => {
	if (!content.value.trim() || isGenerating.value) return;

	conversationHistory.value.push({
		role: 'user',
		content: content.value,
	});

	scrollToBottom();

	try {
		let taskId;
		if (!currentTaskId.value) {
			const result = await post('/start', {
				content: content.value,
				userId: userStore.userId,
				imageData: hasUploadedFile.value,
			});
			taskId = result.taskId;
			currentTaskId.value = taskId;
		} else {
			taskId = currentTaskId.value;
			await post('/continue', {
				taskId,
				content: content.value,
				imageData: hasUploadedFile.value,
			});
		}

		content.value = '';
		hasUploadedFile.value = false;
		doSSE(taskId);
	} catch (error) {
		console.error('发送消息失败:', error);
		message.error(error.message || '发送失败');
	}
};

// SSE连接
const doSSE = (taskId) => {
	isGenerating.value = true;
	isNormalClosure = false;

	const url = `/api/chat?taskId=${taskId}&userId=${userStore.userId}`;
	currentEvtSource = new EventSource(url);

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

	currentEvtSource.addEventListener('reasoning', (e) => {
		const data = JSON.parse(e.data);
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (!lastMsg || lastMsg.role !== 'assistant') {
			conversationHistory.value.push({
				role: 'assistant',
				reasoning: data.reasoning || '',
				content: '',
				isGenerating: true,
			});
		} else {
			lastMsg.reasoning = (lastMsg.reasoning || '') + (data.reasoning || '');
		}
		scrollToBottom();
	});

	currentEvtSource.addEventListener('content', (e) => {
		const data = JSON.parse(e.data);
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (lastMsg && lastMsg.role === 'assistant') {
			lastMsg.content += data.content || '';
		}
		scrollToBottom();
	});

	currentEvtSource.addEventListener('done', () => {
		isNormalClosure = true;
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (lastMsg) {
			lastMsg.isGenerating = false;
		}
		closeEventSource();
		message.success('回复完成');
	});

	currentEvtSource.onerror = (e) => {
		if (!isNormalClosure) {
			console.error('SSE错误:', e);
			message.error('连接出错');
		}
		closeEventSource();
	};
};

// 停止生成
const stopGeneration = () => {
	if (currentEvtSource) {
		isNormalClosure = true;
		const lastMsg = conversationHistory.value[conversationHistory.value.length - 1];
		if (lastMsg && lastMsg.role === 'assistant') {
			lastMsg.content += '\n\n*[用户已停止生成]*';
			lastMsg.isGenerating = false;
		}
		currentEvtSource.close();
		currentEvtSource = null;
		isGenerating.value = false;
		message.info('已停止生成');
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

// 图片上传
const handleUpload = async ({ file, onFinish, onError }) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		const result = await post('/upload', formData);
		if (result.code === 0) {
			content.value = result.data.url;
			hasUploadedFile.value = true;
			message.success('上传成功');
			onFinish();
		} else {
			onError();
			message.error(result.message || '上传失败');
		}
	} catch (error) {
		console.error('上传失败:', error);
		onError();
		message.error('上传失败');
	}
};

// 移除上传
const handleRemoveUpload = () => {
	hasUploadedFile.value = false;
	content.value = '';
};

// 加载历史记录
const loadHistory = async () => {
	historyLoading.value = true;
	try {
		const result = await get(`/history?userId=${userStore.userId}`);
		historyTasks.value = result.map(task => ({
			id: task.taskId,
			title: task.firstMessage || '未命名对话',
			timestamp: task.startTime,
		}));
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
		scrollToBottom();
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

// 退出登录
const handleLogout = () => {
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
});

onUnmounted(() => {
	window.removeEventListener('resize', handleResize);
	if (currentEvtSource) {
		currentEvtSource.close();
	}
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
}

.answer-content {
	line-height: 1.6;
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
