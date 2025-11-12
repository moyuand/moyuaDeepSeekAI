<template>
	<div class="chat-input-wrapper">
		<div class="input-area">
			<n-input
				round
				v-model:value="inputContent"
				:placeholder="placeholder"
				:disabled="disabled"
				@keydown.enter="handleEnter"
				type="textarea"
				:autosize="{
					minRows: 1,
					maxRows: 5,
				}"
			/>
			<div class="btn-group">
				<!-- 图片上传 -->
				<n-upload
					v-if="enableUpload"
					ref="uploadRef"
					:custom-request="customRequest"
					:max="1"
					@before-upload="handleBeforeUpload"
					@remove="handleRemove"
					list-type="image-card"
				>
					<n-button circle quaternary :disabled="disabled">
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
										d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2zm0 5a1 1 0 0 0-.993.883L11 8v3H8a1 1 0 0 0-.117 1.993L8 13h3v3a1 1 0 0 0 1.993.117L13 16v-3h3a1 1 0 0 0 .117-1.993L16 11h-3V8a1 1 0 0 0-1-1z"
									/>
								</svg>
							</n-icon>
						</template>
					</n-button>
				</n-upload>

				<!-- 发送/停止按钮 -->
				<n-button
					circle
					type="primary"
					:disabled="!canSend"
					@click="handleSendOrStop"
				>
					<template #icon>
						<n-icon size="22">
							<svg
								v-if="isGenerating"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M6 6h12v12H6z"
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
									d="M3 20v-6l8-2l-8-2V4l19 8z"
								/>
							</svg>
						</n-icon>
					</template>
				</n-button>

				<!-- 清空按钮 -->
				<n-button
					v-if="enableClear"
					quaternary
					circle
					:disabled="disabled"
					@click="handleClear"
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
									d="M7 21q-.825 0-1.413-.588T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.588 1.413T17 21H7ZM17 6H7v13h10V6ZM9 17h2V8H9v9Zm4 0h2V8h-2v9ZM7 6v13V6Z"
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
	import { ref, computed } from "vue";
	import { NInput, NButton, NUpload, NIcon } from "naive-ui";

	const props = defineProps({
		modelValue: {
			type: String,
			default: "",
		},
		placeholder: {
			type: String,
			default: "请输入对话内容...",
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		isGenerating: {
			type: Boolean,
			default: false,
		},
		enableUpload: {
			type: Boolean,
			default: true,
		},
		enableClear: {
			type: Boolean,
			default: true,
		},
	});

	const emit = defineEmits([
		"update:modelValue",
		"send",
		"stop",
		"clear",
		"upload",
		"remove-upload",
	]);

	const inputContent = computed({
		get: () => props.modelValue,
		set: (val) => emit("update:modelValue", val),
	});

	const uploadRef = ref(null);

	const canSend = computed(() => {
		return !props.disabled && (inputContent.value.trim() || props.isGenerating);
	});

	const handleEnter = (e) => {
		// Ctrl/Cmd + Enter 发送
		if ((e.ctrlKey || e.metaKey) && !props.isGenerating) {
			e.preventDefault();
			handleSendOrStop();
		}
	};

	const handleSendOrStop = () => {
		if (props.isGenerating) {
			emit("stop");
		} else if (inputContent.value.trim()) {
			emit("send", inputContent.value);
		}
	};

	const handleClear = () => {
		emit("clear");
	};

	const customRequest = ({ file, onFinish, onError }) => {
		emit("upload", { file, onFinish, onError });
	};

	const handleBeforeUpload = (data) => {
		const { file } = data;
		const isImage = file.type.startsWith("image/");
		if (!isImage) {
			return false;
		}
		const isLt5M = file.size / 1024 / 1024 < 5;
		if (!isLt5M) {
			return false;
		}
		return true;
	};

	const handleRemove = () => {
		emit("remove-upload");
	};
</script>

<style scoped>
	.chat-input-wrapper {
		width: 100%;
		background: var(--n-color-card);
		border-top: 1px solid var(--n-border-color);
	}

	.input-area {
		display: flex;
		align-items: flex-end;
		gap: 12px;
		padding: 16px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.input-area :deep(.n-input) {
		flex: 1;
	}

	.btn-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.input-area {
			padding: 12px;
		}

		.btn-group {
			gap: 4px;
		}
	}
</style>
