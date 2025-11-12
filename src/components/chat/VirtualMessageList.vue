<template>
	<div ref="scrollContainerRef" class="message-list-container">
		<VList ref="vListRef" :data="messages" :item-size="estimatedSize">
			<template #default="{ item, index }">
				<div :key="index" class="message-wrapper">
					<!-- 用户消息 -->
					<div v-if="item.role === 'user'" class="user-message">
						<div class="message-content">
							<div class="message-text" v-html="safeMarkdown(item.content)"></div>
							<div v-if="item.imageUrl" class="message-image">
								<img :src="item.imageUrl" alt="用户上传的图片" />
							</div>
						</div>
					</div>

					<!-- AI消息 -->
					<div v-else-if="item.role === 'assistant'" class="assistant-message">
						<div class="message-content">
							<!-- 思考过程 -->
							<div
								v-if="item.reasoning && item.reasoning.trim()"
								class="reasoning-section"
							>
								<n-collapse>
									<n-collapse-item title="💭 思考过程" name="reasoning">
										<div
											class="reasoning-content"
											v-html="safeMarkdown(item.reasoning)"
										></div>
									</n-collapse-item>
								</n-collapse>
							</div>

							<!-- 回答内容 -->
							<div class="answer-content" v-html="safeMarkdown(item.content)"></div>

							<!-- 加载动画 -->
							<div v-if="item.isGenerating" class="typing-indicator">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</div>
					</div>
				</div>
			</template>
		</VList>
	</div>
</template>

<script setup>
	import { ref, watch, nextTick } from "vue";
	import { VList } from "virtua/vue";
	import { NCollapse, NCollapseItem } from "naive-ui";
	import { safeMarkdown } from "@/utils/markdown";

	const props = defineProps({
		messages: {
			type: Array,
			required: true,
			default: () => [],
		},
		estimatedSize: {
			type: Number,
			default: 200, // 预估每条消息高度
		},
		autoScroll: {
			type: Boolean,
			default: true,
		},
	});

	const scrollContainerRef = ref(null);
	const vListRef = ref(null);

	// 滚动到底部
	const scrollToBottom = () => {
		if (props.autoScroll && vListRef.value) {
			nextTick(() => {
				vListRef.value.scrollToIndex(props.messages.length - 1, {
					align: "end",
					smooth: true,
				});
			});
		}
	};

	// 监听消息变化，自动滚动
	watch(
		() => props.messages.length,
		() => {
			scrollToBottom();
		}
	);

	// 暴露方法给父组件
	defineExpose({
		scrollToBottom,
		scrollToIndex: (index) => {
			vListRef.value?.scrollToIndex(index);
		},
	});
</script>

<style scoped>
	.message-list-container {
		height: 100%;
		overflow: hidden;
	}

	.message-wrapper {
		padding: 12px 16px;
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
		margin-bottom: 16px;
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
		margin-bottom: 16px;
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
		color: var(--n-text-color);
	}

	.answer-content {
		line-height: 1.6;
	}

	.message-image img {
		max-width: 100%;
		border-radius: 8px;
		margin-top: 8px;
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
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-10px);
			opacity: 1;
		}
	}

	/* Dark theme support */
	.dark-theme .assistant-message .message-content {
		background: rgba(255, 255, 255, 0.05);
	}

	.dark-theme .reasoning-content {
		background: rgba(102, 126, 234, 0.1);
	}
</style>
