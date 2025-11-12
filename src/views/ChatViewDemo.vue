<template>
	<div class="chat-view-demo">
		<!-- 聊天头部 -->
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
			<!-- 历史记录侧边栏 -->
			<HistorySidebar
				v-if="isDesktop && showHistorySidebar"
				:history-list="historyList"
				:active-id="activeHistoryId"
				:loading="historyLoading"
				@select="loadHistory"
				@delete="deleteHistory"
				@close="showHistorySidebar = false"
			/>

			<!-- 主聊天区域 -->
			<div class="chat-main">
				<!-- 虚拟滚动消息列表 -->
				<VirtualMessageList
					ref="messageListRef"
					:messages="chatStore.messages"
					:estimated-size="200"
					:auto-scroll="true"
				/>

				<!-- 输入框 -->
				<ChatInput
					v-model="inputContent"
					:is-generating="chatStore.isLoading"
					:disabled="!userStore.isLoggedIn"
					@send="handleSend"
					@stop="handleStop"
					@clear="handleClear"
					@upload="handleUpload"
					@remove-upload="handleRemoveUpload"
				/>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue';
	import { useRouter } from 'vue-router';
	import { useUserStore, useChatStore, useThemeStore } from '@/stores';
	import {
		ChatHeader,
		ChatInput,
		VirtualMessageList,
		HistorySidebar,
	} from '@/components/chat';

	const router = useRouter();
	const userStore = useUserStore();
	const chatStore = useChatStore();
	const themeStore = useThemeStore();

	// 响应式检测
	const isDesktop = ref(window.innerWidth >= 768);
	window.addEventListener('resize', () => {
		isDesktop.value = window.innerWidth >= 768;
	});

	// 状态
	const inputContent = ref('');
	const selectedModel = ref('deepseek-r1');
	const showHistorySidebar = ref(true);
	const messageListRef = ref(null);

	// 模型选项
	const modelOptions = [
		{ label: 'DeepSeek R1', value: 'deepseek-r1' },
		{ label: 'DeepSeek Chat', value: 'deepseek-chat' },
		{ label: 'GPT-4', value: 'gpt-4' },
	];

	// 历史记录（演示数据）
	const historyList = ref([]);
	const activeHistoryId = ref(null);
	const historyLoading = ref(false);

	// 发送消息
	const handleSend = async (content) => {
		if (!content.trim()) return;

		// 添加用户消息
		chatStore.addMessage({
			role: 'user',
			content: content.trim(),
		});

		inputContent.value = '';
		chatStore.setLoading(true);

		try {
			// TODO: 调用后端API
			// 这里是演示代码，实际需要接入后端

			// 模拟AI响应
			setTimeout(() => {
				chatStore.addMessage({
					role: 'assistant',
					content: '这是一个演示响应。实际使用时需要接入后端API。',
					reasoning: '这是思考过程...',
				});
				chatStore.setLoading(false);
			}, 1000);
		} catch (error) {
			console.error('发送消息失败:', error);
			chatStore.setError(error.message);
			chatStore.setLoading(false);
		}
	};

	// 停止生成
	const handleStop = () => {
		chatStore.setLoading(false);
		// TODO: 取消后端请求
	};

	// 清空对话
	const handleClear = () => {
		chatStore.clearMessages();
	};

	// 图片上传
	const handleUpload = async ({ file, onFinish, onError }) => {
		try {
			// TODO: 调用上传API
			console.log('上传文件:', file.name);
			onFinish();
		} catch (error) {
			console.error('上传失败:', error);
			onError();
		}
	};

	// 移除上传
	const handleRemoveUpload = () => {
		console.log('移除上传');
	};

	// 加载历史
	const loadHistory = (id) => {
		activeHistoryId.value = id;
		// TODO: 加载历史对话
	};

	// 删除历史
	const deleteHistory = (id) => {
		// TODO: 删除历史对话
		historyList.value = historyList.value.filter((item) => item.id !== id);
	};

	// 退出登录
	const handleLogout = () => {
		userStore.logout();
		router.push('/login');
	};

	// 初始化
	onMounted(() => {
		// 加载历史记录
		// TODO: 从后端加载
	});
</script>

<style scoped>
	.chat-view-demo {
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
</style>
