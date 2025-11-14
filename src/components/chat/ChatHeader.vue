<template>
	<div class="chat-header">
		<div class="header-left">
			<!-- 历史记录按钮 (移动端) -->
			<n-button
				v-if="!isDesktop"
				quaternary
				circle
				@click="$emit('toggle-history')"
			>
				<template #icon>
					<n-icon size="24">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>

			<!-- 标题 -->
			<h1 class="title">{{ title }}</h1>
		</div>

		<div class="header-right">
			<!-- 侧边栏切换按钮 (桌面端) -->
			<n-button
				v-if="isDesktop && !showSidebar"
				quaternary
				circle
				@click="$emit('toggle-history')"
			>
				<template #icon>
					<n-icon size="22">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>

			<!-- 新对话按钮 -->
			<n-button quaternary circle @click="$emit('new-chat')">
				<template #icon>
					<n-icon size="22">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>

			<!-- 主题切换 -->
			<n-button quaternary circle @click="$emit('toggle-theme')">
				<template #icon>
					<n-icon size="22">
						<svg
							v-if="isDark"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
							/>
						</svg>
						<svg
							v-else
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M12 17q-2.075 0-3.538-1.463T7 12q0-2.075 1.463-3.538T12 7q2.075 0 3.538 1.463T17 12q0 2.075-1.463 3.538T12 17ZM2 13q-.425 0-.713-.288T1 12q0-.425.288-.713T2 11h2q.425 0 .713.288T5 12q0 .425-.288.713T4 13H2Zm18 0q-.425 0-.713-.288T19 12q0-.425.288-.713T20 11h2q.425 0 .713.288T23 12q0 .425-.288.713T22 13h-2Zm-8-8q-.425 0-.713-.288T11 4V2q0-.425.288-.713T12 1q.425 0 .713.288T13 2v2q0 .425-.288.713T12 5Zm0 18q-.425 0-.713-.288T11 22v-2q0-.425.288-.713T12 19q.425 0 .713.288T13 20v2q0 .425-.288.713T12 23ZM5.65 7.05L4.575 6q-.3-.275-.288-.7t.288-.7q.3-.3.725-.3t.7.3L7.05 5.65q.275.3.275.7t-.275.7q-.275.3-.687.288T5.65 7.05ZM18 19.425l-1.05-1.075q-.275-.3-.275-.713t.275-.687q.275-.3.688-.287t.712.287L19.425 18q.3.275.288.7t-.288.7q-.3.3-.725.3t-.7-.3ZM16.95 7.05q-.3-.275-.288-.687t.288-.713L18 4.575q.275-.3.7-.288t.7.288q.3.3.3.725t-.3.7L18.35 7.05q-.3.275-.7.275t-.7-.275ZM4.575 19.425q-.3-.3-.3-.725t.3-.7l1.075-1.05q.3-.275.712-.275t.688.275q.3.275.288.688t-.288.712L6 19.425q-.275.3-.7.288t-.7-.288Z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>

			<!-- 设置按钮 -->
			<n-button quaternary circle @click="$emit('go-settings')">
				<template #icon>
					<n-icon size="22">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17ZM18.41 14l.8.9l-1.28 2.22l-1.18-.24a3 3 0 0 0-3.45 2L12.92 20h-2.56L10 18.86a3 3 0 0 0-3.45-2l-1.18.24l-1.3-2.21l.8-.9a3 3 0 0 0 0-4l-.8-.9l1.28-2.2l1.18.24a3 3 0 0 0 3.45-2L10.36 4h2.56l.38 1.14a3 3 0 0 0 3.45 2l1.18-.24l1.28 2.22l-.8.9a3 3 0 0 0 0 3.98Zm-6.77-6a4 4 0 1 0 4 4a4 4 0 0 0-4-4Zm0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2Z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>

			<!-- 退出登录 -->
			<n-button quaternary circle @click="$emit('logout')">
				<template #icon>
					<n-icon size="22">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h7v2H5v14h7v2H5Zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5l-5 5Z"
							/>
						</svg>
					</n-icon>
				</template>
			</n-button>
		</div>
	</div>
</template>

<script setup>
	import { NButton, NIcon } from "naive-ui";

	defineProps({
		title: {
			type: String,
			default: "墨鱼AI助手",
		},
		isDesktop: {
			type: Boolean,
			default: true,
		},
		isDark: {
			type: Boolean,
			default: false,
		},
		showSidebar: {
			type: Boolean,
			default: true,
		},
	});

	defineEmits([
		"toggle-history",
		"new-chat",
		"toggle-theme",
		"go-settings",
		"logout",
	]);
</script>

<style scoped>
	.chat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		background: var(--n-color-card);
		border-bottom: 1px solid var(--n-border-color);
		box-shadow: 0 2px 8px var(--chat-shadow);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: var(--n-text-color);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* 确保按钮图标在任何主题下都可见 */
	.header-right :deep(.n-button) {
		color: var(--n-text-color);
	}

	.header-right :deep(.n-button svg) {
		color: var(--n-text-color);
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.chat-header {
			padding: 12px 16px;
		}

		.title {
			font-size: 18px;
		}

		.header-right {
			gap: 4px;
		}
	}
</style>
