<template>
	<div class="history-sidebar">
		<div class="history-header">
			<h2>聊天历史</h2>
			<n-button quaternary circle @click="$emit('close')">
				<template #icon>
					<n-icon>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="m12 20l-8-8l8-8l1.425 1.4l-5.6 5.6H20v2H7.825l5.6 5.6z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="history-loading">
			<n-spin size="medium" />
			<p>加载历史记录中...</p>
		</div>

		<!-- 空状态 -->
		<div v-else-if="historyList.length === 0" class="history-empty">
			<n-empty description="暂无历史聊天记录" />
		</div>

		<!-- 历史列表 -->
		<div v-else class="history-list">
			<div
				v-for="item in historyList"
				:key="item.id"
				class="history-item"
				:class="{ active: item.id === activeId }"
				@click="$emit('select', item.id)"
			>
				<div class="history-item-content">
					<n-icon size="18" class="history-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"
							/>
						</svg>
					</n-icon>
					<div class="history-item-info">
						<div class="history-title">{{ item.title || "未命名对话" }}</div>
						<div class="history-time">{{ formatTime(item.timestamp) }}</div>
					</div>
				</div>
				<n-button
					quaternary
					circle
					size="small"
					class="history-delete"
					@click.stop="$emit('delete', item.id)"
				>
					<template #icon>
						<n-icon>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M7 21q-.825 0-1.413-.588T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.588 1.413T17 21H7Zm2-4h2V8H9v9Zm4 0h2V8h-2v9Z"
								/>
							</svg>
						</n-icon>
					</template>
				</n-button>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { NButton, NIcon, NSpin, NEmpty } from "naive-ui";

	const props = defineProps({
		historyList: {
			type: Array,
			required: true,
			default: () => [],
		},
		activeId: {
			type: [String, Number],
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	});

	defineEmits(["select", "delete", "close"]);

	const formatTime = (timestamp) => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now - date;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "刚刚";
		if (minutes < 60) return `${minutes}分钟前`;
		if (hours < 24) return `${hours}小时前`;
		if (days < 7) return `${days}天前`;

		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};
</script>

<style scoped>
	.history-sidebar {
		width: 280px;
		height: 100%;
		background: var(--n-color-card);
		border-right: 1px solid var(--n-border-color);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--n-border-color);
	}

	.history-header h2 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: var(--n-text-color);
	}

	.history-loading,
	.history-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 12px;
		color: var(--n-text-color-disabled);
	}

	.history-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.history-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		margin-bottom: 4px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.history-item:hover {
		background: var(--n-color-hover);
	}

	.history-item.active {
		background: var(--n-color-pressed);
	}

	.history-item-content {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.history-icon {
		flex-shrink: 0;
		color: var(--n-text-color-disabled);
	}

	.history-item-info {
		flex: 1;
		min-width: 0;
	}

	.history-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--n-text-color);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-time {
		font-size: 12px;
		color: var(--n-text-color-disabled);
		margin-top: 2px;
	}

	.history-delete {
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.history-item:hover .history-delete {
		opacity: 1;
	}

	/* 滚动条样式 */
	.history-list::-webkit-scrollbar {
		width: 6px;
	}

	.history-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.history-list::-webkit-scrollbar-thumb {
		background: var(--n-scrollbar-color);
		border-radius: 3px;
	}

	.history-list::-webkit-scrollbar-thumb:hover {
		background: var(--n-scrollbar-color-hover);
	}
</style>
