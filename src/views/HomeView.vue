<template>
	<n-message-provider>
		<!-- 聊天容器使用flex布局，在PC端可以水平分为历史区和聊天区 -->
		<div
			class="chat-container theme-container"
			:class="{
				'chat-container-with-history': showHistoryInSidebar,
				'dark-theme': themeMode === 'dark',
			}"
		>
			<!-- PC端历史记录侧边栏 -->
			<div v-if="isDesktop && showHistoryInSidebar" class="history-sidebar">
				<div class="history-header">
					<h2>聊天历史</h2>
					<n-button quaternary circle @click="toggleHistorySidebar">
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

				<div v-if="historyLoading" class="history-loading">
					<n-spin size="medium" />
					<p>加载历史记录中...</p>
				</div>

				<div v-else-if="historyTasks.length === 0" class="history-empty">
					<n-empty description="暂无历史聊天记录" />
				</div>

				<div v-else class="history-list">
					<div
						v-for="task in historyTasks"
						:key="task.taskId"
						class="history-item"
						:class="{ active: currentTaskId === task.taskId }"
						@click="loadHistoryConversation(task.taskId)"
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
								<div class="history-time">
									{{ formatDate(task.startTime) }}
								</div>
								<div class="history-activity">
									上次活动: {{ formatDate(task.lastActivity) }}
								</div>
							</div>
						</div>
						<n-button
							quaternary
							circle
							size="small"
							class="history-delete"
							@click.stop="confirmDeleteHistory(task.taskId)"
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

			<!-- 主要内容区域 -->
			<div class="main-content theme-container">
				<n-page-header title="墨鱼AI智能助手" class="p-4">
					<!-- <template #avatar>
            <n-avatar class="text-blue-500 bg-blue-100" round>AI</n-avatar>
          </template> -->
					<template #extra>
						<n-space>
							<!-- 移动端显示历史按钮 -->
							<n-button
								v-if="!isDesktop"
								quaternary
								circle
								@click="showHistoryDrawer = true"
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
												d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89l.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7s-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54l.72-1.21l-3.5-2.08V8H12z"
											/>
										</svg>
									</n-icon>
								</template>
							</n-button>

							<!-- PC端显示历史切换按钮 -->
							<n-button
								v-if="isDesktop"
								quaternary
								circle
								@click="toggleHistorySidebar"
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
												d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89l.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7s-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54l.72-1.21l-3.5-2.08V8H12z"
											/>
										</svg>
									</n-icon>
								</template>
							</n-button>

							<n-dropdown
								trigger="click"
								:options="userMenuOptions"
								@select="handleSelect"
							>
								<n-avatar round size="small" class="cursor-pointer user-avatar">
									{{ getAvatarText() }}
								</n-avatar>
							</n-dropdown>
						</n-space>
					</template>
				</n-page-header>

				<!-- 聊天记录区域 -->
				<div class="messages">
					<div
						v-for="(msg, index) in conversationHistory"
						:key="index"
						class="message-row"
						:class="msg.role === 'user' ? 'user' : 'assistant'"
					>
						<div class="message-bubble">
							<!-- 用户消息 -->
							<template v-if="msg.role === 'user'">
								<div v-html="safeMarkdown(msg.content)"></div>
							</template>
							<!-- AI 消息 -->
							<template v-else>
								<div v-if="msg.reasoning">
									<em>思考过程：</em>
									<div v-html="safeMarkdown(msg.reasoning)"></div>
								</div>
								<div v-if="msg.content">
									<em>结果：</em>
									<div v-html="safeMarkdown(msg.content)"></div>
								</div>
							</template>
						</div>
					</div>
				</div>

				<!-- 输入区域固定在底部 -->
				<div class="input-area">
					<n-input
						round
						v-model:value="content"
						placeholder="请输入对话内容"
						@keydown.enter="sendMessage"
					/>
					<div class="btn-group">
						<n-upload
							ref="uploadRef"
							:custom-request="customRequest"
							:headers="{
								'naive-info': 'hello!',
							}"
							:data="{
								'naive-data': 'cool! naive!',
							}"
							:max="1"
							@before-upload="beforeUpload"
							@remove="handleRemove"
							list-type="image-card"
						>
							<n-button circle quaternary>
								<n-icon size="36">
									<AddCircle32Filled />
								</n-icon>
							</n-button>
						</n-upload>

						<n-button
							circle
							@click="isGenerating ? stopGeneration() : sendMessage()"
							type="primary"
						>
							<n-icon size="22">
								<template v-if="isGenerating">
									<Stop24Filled />
								</template>
								<template v-else>
									<Send24Filled />
								</template>
							</n-icon>
						</n-button>
						<n-button @click="clearConversation" quaternary circle>
							<n-icon size="22">
								<Delete16Filled />
							</n-icon>
						</n-button>
					</div>
				</div>
			</div>

			<!-- 移动端历史记录抽屉 -->
			<n-drawer v-model:show="showHistoryDrawer" placement="left" :width="280">
				<n-drawer-content title="聊天历史">
					<div v-if="historyLoading" class="history-loading">
						<n-spin size="medium" />
						<p>加载历史记录中...</p>
					</div>

					<div v-else-if="historyTasks.length === 0" class="history-empty">
						<n-empty description="暂无历史聊天记录" />
					</div>

					<div v-else class="history-list">
						<div
							v-for="task in historyTasks"
							:key="task.taskId"
							class="history-item"
							:class="{ active: currentTaskId === task.taskId }"
							@click="
								loadHistoryConversation(task.taskId);
								showHistoryDrawer = false;
							"
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
									<div class="history-time">
										{{ formatDate(task.startTime) }}
									</div>
									<div class="history-activity">
										上次活动: {{ formatDate(task.lastActivity) }}
									</div>
								</div>
							</div>
							<n-button
								quaternary
								circle
								size="small"
								class="history-delete"
								@click.stop="confirmDeleteHistory(task.taskId)"
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
				</n-drawer-content>
			</n-drawer>
		</div>
	</n-message-provider>
</template>

<script setup>
	import { ref, nextTick, onMounted, onUnmounted, computed, inject } from "vue";
	import { safeMarkdown } from "@/utils/markdown";
	import { useMessage, useDialog } from "naive-ui";
	import { useRouter } from "vue-router";
	import {
		Send24Filled,
		Stop24Filled,
		Delete16Filled,
		AddCircle32Filled,
	} from "@vicons/fluent";
	import { get, post, upload, del } from "@/utils/request";
	import "highlight.js/styles/github.css";

	// 监听主题模式
	const themeMode = inject("themeMode");

	let userId = ref(null);
	if (
		localStorage.getItem("userId") &&
		localStorage.getItem("userId") !== null
	) {
		userId.value = localStorage.getItem("userId");
	}

	// 1) 用户输入的文本
	const content = ref("");

	// 添加文件上传状态跟踪变量
	const hasUploadedFile = ref(false);
	// 文件上传组件引用
	const uploadRef = ref(null);
	// 当前上传的文件ID，用于跟踪
	const currentFileId = ref(null);

	// 2) 多轮对话记录
	//    每个元素示例：
	//    - 用户消息：{ role: 'user', content: '...' }
	//    - AI 消息：{ role: 'assistant', reasoning: '...', content: '...' }
	const conversationHistory = ref([]);

	// 3) 当前对话的 taskId
	const currentTaskId = ref(null);
	const message = useMessage();
	const dialog = useDialog();

	// 4) 是否正在生成回复
	const isGenerating = ref(false);
	// 定义在组件级别，可被多个函数共享
	let currentEvtSource = null;
	let isNormalClosure = false;

	const beforeUpload = async (data) => {
		if (
			data.file.file?.type !== "image/jpeg" &&
			data.file.file?.type !== "image/png" &&
			data.file.file?.type !== "image/jpg"
		) {
			console.error("只能上传 jpg、png、jpeg 格式的图片");
			message.error("只能上传 jpg、png、jpeg 格式的图片");
			return false;
		}
		return true;
	};

	// 处理文件移除事件
	const handleRemove = () => {
		console.log("文件已手动移除");
		hasUploadedFile.value = false;
		content.value = ""; // 清空内容框中的图片URL
		currentFileId.value = null;
	};

	// 上传文件
	const customRequest = async (data) => {
		try {
			console.log("开始上传文件：", data.file.file);
			// 生成唯一文件ID
			currentFileId.value = Date.now().toString();

			const result = await upload("/upload", data.file.file);
			console.log("上传文件结果：", result);
			if (result.code === 0) {
				message.success("上传成功");
				content.value = result.data.url;
				hasUploadedFile.value = true; // 设置文件上传状态为true
				console.log(
					"已设置hasUploadedFile=true，当前值:",
					hasUploadedFile.value
				);
			} else {
				message.error(result.message || "上传失败");
				currentFileId.value = null;
				hasUploadedFile.value = false;

				// 上传失败时清空文件列表
				if (uploadRef.value) {
					try {
						console.log("上传失败，清空文件列表");
						uploadRef.value.clear();
					} catch (e) {
						console.error("清空文件列表失败:", e);
					}
				}
			}
		} catch (error) {
			console.error("上传出错：", error);
			message.error(error.message || "上传失败");
			currentFileId.value = null;
			hasUploadedFile.value = false;

			// 上传出错时清空文件列表
			if (uploadRef.value) {
				try {
					console.log("上传出错，清空文件列表");
					uploadRef.value.clear();
				} catch (e) {
					console.error("清空文件列表失败:", e);
				}
			}
		}
	};

	/**
	 * 停止生成
	 */
	const stopGeneration = () => {
		if (currentEvtSource) {
			// 在当前消息中添加提示
			const currentIndex = conversationHistory.value.length - 1;
			if (
				currentIndex >= 0 &&
				conversationHistory.value[currentIndex].role === "assistant"
			) {
				conversationHistory.value[currentIndex].content +=
					"\n\n*[用户已停止生成]*";
			}

			// 标记为正常关闭
			isNormalClosure = true;

			// 关闭连接
			try {
				currentEvtSource.close();
			} catch (e) {
				console.error("关闭EventSource时发生错误:", e);
			}

			currentEvtSource = null;
			isGenerating.value = false;

			message.info("已停止生成回复");
		}
	};

	/**
	 * 发送消息（首次 or 后续）
	 */
	const sendMessage = async () => {
		// 若输入为空，则不处理
		if (!content.value.trim()) return;

		// 如果正在生成，则不处理
		if (isGenerating.value) return;

		let taskId;

		// 添加日志，检查上传状态
		console.log("发送消息前，文件上传状态：", hasUploadedFile.value);

		// 先将用户消息 push 到对话记录
		conversationHistory.value.push({
			role: "user",
			content: content.value,
		});

		// 滚动到最新消息
		scrollToBottom();

		try {
			// 判断是首次还是后续
			if (!currentTaskId.value) {
				// 第一次：POST /start
				console.log("调用start接口，imageData=", hasUploadedFile.value);
				const result = await post("/start", {
					content: content.value,
					userId: userId.value,
					imageData: hasUploadedFile.value,
				});

				if (!result.taskId) {
					throw new Error("服务器未返回有效的taskId");
				}

				taskId = result.taskId;
				currentTaskId.value = taskId;
			} else {
				// 后续：POST /continue
				console.log("调用continue接口，imageData=", hasUploadedFile.value);
				taskId = currentTaskId.value;
				await post("/continue", {
					taskId,
					content: content.value,
					userId: userId.value,
					imageData: hasUploadedFile.value,
				});
			}

			// 清空输入框
			content.value = "";

			// 重置文件上传状态并主动清空文件列表
			if (hasUploadedFile.value) {
				console.log("准备清空文件列表和重置状态");
				// 手动清空文件列表 - 使用Naive UI的方法
				hasUploadedFile.value = false;
				currentFileId.value = null;

				// 给DOM一点时间更新
				setTimeout(() => {
					if (uploadRef.value) {
						try {
							console.log("清空文件列表");
							// 使用更直接的方式清空
							uploadRef.value.clear();
							// 直接操作文件列表DOM元素(备用方案)
							const fileListEl = document.querySelector(".n-upload-file-list");
							if (fileListEl) {
								fileListEl.innerHTML = "";
							}
						} catch (e) {
							console.error("清空文件列表失败:", e);
						}
					}
				}, 100);
			}

			// 建立 SSE 连接
			doSSE(taskId);
		} catch (error) {
			// 显示错误信息
			message.error(error.message || "发送消息失败");
			console.error("发送消息失败:", error);

			// 从对话记录中移除最后一条消息
			if (conversationHistory.value.length > 0) {
				conversationHistory.value.pop();
			}
		}
	};

	// 添加连接检测和重连机制
	let connectionCheckInterval = null;

	// 检查连接状态并在需要时重连
	// eslint-disable-next-line no-unused-vars
	const checkConnection = () => {
		if (currentTaskId.value && !currentEvtSource) {
			console.log("检测到连接已断开，尝试重新连接...");
			doSSE(currentTaskId.value);
		}
	};

	/**
	 * 建立 SSE，实时接收 AI 消息
	 */
	const doSSE = (taskId) => {
		// 设置生成状态为true
		isGenerating.value = true;

		// 重置标记，用于跟踪连接是否正常关闭
		isNormalClosure = false;

		// 创建并保存EventSource实例
		// 使用配置的API代理访问后端
		currentEvtSource = new EventSource(
			`/api/events?taskId=${taskId}&userId=${userId.value || ""}`
		);

		// 在对话历史中新建一条空的 AI 消息，准备拼接思考过程和结果
		conversationHistory.value.push({
			role: "assistant",
			reasoning: "",
			content: "",
		});
		const currentIndex = conversationHistory.value.length - 1;

		// 添加超时保护，防止长时间无响应
		const connectionTimeout = setTimeout(() => {
			console.log("EventSource连接超时，自动关闭");
			message.warning("AI响应超时（2分钟），请重试");
			closeEventSource();

			// 添加超时提示到消息中
			if (conversationHistory.value[currentIndex]) {
				conversationHistory.value[currentIndex].content +=
					"\n\n**[系统提示]** 响应超时（2分钟），请重试";
			}
		}, 120000); // 120秒超时

		// 添加统一的关闭EventSource函数
		const closeEventSource = () => {
			// 防止重复关闭
			if (!currentEvtSource) {
				console.log("EventSource已经为null，无需关闭");
				return;
			}

			console.log(
				"正在关闭EventSource连接，当前状态:",
				currentEvtSource.readyState === 0
					? "CONNECTING"
					: currentEvtSource.readyState === 1
						? "OPEN"
						: currentEvtSource.readyState === 2
							? "CLOSED"
							: "UNKNOWN"
			);

			// 先设置标记，即使在关闭过程中出错也能被识别为正常关闭
			isNormalClosure = true;

			try {
				// 在关闭前移除事件处理器，避免关闭过程中触发事件
				currentEvtSource.onmessage = null;
				currentEvtSource.onerror = null;
				currentEvtSource.close();
				console.log("EventSource连接已关闭");
			} catch (e) {
				console.error("关闭EventSource时发生错误:", e);
			} finally {
				// 确保资源被释放
				currentEvtSource = null;
				isGenerating.value = false;
				// 清除超时定时器
				clearTimeout(connectionTimeout);
			}
		};

		currentEvtSource.onmessage = (e) => {
			// 处理完成信号 - 增加对[done]的判断
			if (
				e.data === "[DONE]" ||
				e.data.includes('"status": "completed"') ||
				e.data.includes('"status":"completed"') ||
				e.data.startsWith("[done]")
			) {
				console.log("接收到完成信号:", e.data);
				isNormalClosure = true; // 立即标记为正常关闭，防止后续触发onerror

				// 添加一个小延迟再关闭连接，避免浏览器出现竞态条件
				setTimeout(() => {
					closeEventSource();
					scrollToBottom();
				}, 100);

				return; // 确保完成后不再处理其他情况
			} else if (e.data.startsWith("[reasoning]")) {
				const chunk = e.data.replace("[reasoning]", "");
				// 解码URL编码的内容
				const decodedChunk = decodeURIComponent(chunk);
				conversationHistory.value[currentIndex].reasoning += decodedChunk;
				scrollToBottom();
			} else if (e.data.startsWith("[result]")) {
				const chunk = e.data.replace("[result]", "");
				// 解码URL编码的内容
				const decodedChunk = decodeURIComponent(chunk);
				conversationHistory.value[currentIndex].content += decodedChunk;
				scrollToBottom();
			} else if (e.data.startsWith("[error]")) {
				// 处理错误信息
				const errorMsg = e.data.replace("[error]", "");
				const decodedError = decodeURIComponent(errorMsg);
				message.error(decodedError || "AI响应出错");
				conversationHistory.value[currentIndex].content +=
					`\n\n**[错误]** ${decodedError}`;
				closeEventSource();
				scrollToBottom();
			} else {
				console.log("Other SSE data:", e.data);
				// 检查是否包含完成信息或错误信息
				try {
					const data = JSON.parse(e.data);
					if (data.status === "completed") {
						isNormalClosure = true; // 确保标记为正常关闭
						closeEventSource();
						scrollToBottom();
						return; // 确保完成后不再处理其他情况
					} else if (data.error) {
						message.error(data.error || "AI响应出错");
						conversationHistory.value[currentIndex].content +=
							`\n\n**[错误]** ${data.error}`;
						closeEventSource();
						scrollToBottom();
					}
				} catch (error) {
					// 非JSON格式，忽略错误
					console.debug("非JSON格式数据:", e.data, "解析错误:", error.message);
				}
			}
		};

		currentEvtSource.onopen = () => {
			console.log("EventSource连接已打开");
		};

		currentEvtSource.onerror = (err) => {
			console.log("EventSource onerror触发，当前状态:", {
				isNormalClosure,
				readyState: currentEvtSource ? currentEvtSource.readyState : "null",
				error: err,
			});

			// 检查连接是否已标记为正常关闭或状态码为关闭
			if (isNormalClosure) {
				console.log("EventSource已标记为正常关闭，忽略错误");
				closeEventSource(); // 确保连接被关闭
				return;
			}

			// 检查连接是否已经关闭或正在关闭
			if (currentEvtSource && currentEvtSource.readyState === 2) {
				console.log("EventSource已经处于关闭状态，忽略错误");
				closeEventSource();
				return;
			}

			console.error("EventSource 真正的错误:", err);

			// 处理真正的错误情况
			message.error("连接错误，请刷新页面重试");

			// 在消息中显示错误提示
			if (conversationHistory.value[currentIndex]) {
				conversationHistory.value[currentIndex].content +=
					"\n\n**[系统错误]** 连接中断，请刷新页面重试";
			}

			closeEventSource();
		};

		// 在组件卸载时确保清理连接
		onUnmounted(() => {
			closeEventSource();
		});
	};

	// 添加用户滚动状态变量
	const isUserScrolling = ref(false);
	const lastScrollTop = ref(0);

	/**
	 * 滚动到最新消息
	 */
	const scrollToBottom = () => {
		// 如果用户正在手动滚动，则不自动滚动
		if (isUserScrolling.value) return;

		nextTick(() => {
			const messagesContainer = document.querySelector(".messages");
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		});
	};
	async function getUserId() {
		const result = await get("/generateUserId");
		console.log("获取用户ID：", result.userId);
		userId.value = result.userId;
		localStorage.setItem("userId", userId.value);
	}

	// 监听滚动事件
	onMounted(() => {
		// 如果localStorage中没有userId，则获取新的userId
		if (!userId.value) {
			getUserId();
		}

		localStorage.setItem("userId", userId.value);

		// 检查是否有导入的历史对话
		checkImportedConversation();

		const messagesContainer = document.querySelector(".messages");
		if (messagesContainer) {
			messagesContainer.addEventListener("scroll", () => {
				// 检测是否是用户手动滚动
				const currentScrollTop = messagesContainer.scrollTop;
				const maxScrollTop =
					messagesContainer.scrollHeight - messagesContainer.clientHeight;

				// 更新用户滚动状态
				isUserScrolling.value = true;

				// 如果滚动到底部，重新启用自动滚动
				if (Math.abs(currentScrollTop - maxScrollTop) < 10) {
					isUserScrolling.value = false;
				}

				lastScrollTop.value = currentScrollTop;
			});
		}

		// 确保在页面离开或刷新时关闭连接
		window.addEventListener("beforeunload", () => {
			if (currentEvtSource) {
				currentEvtSource.close();
			}
		});

		// 加载历史聊天记录
		fetchHistoryTasks();

		// 添加窗口大小变化监听
		window.addEventListener("resize", handleResize);
	});

	/**
	 * 清空对话
	 */
	const clearConversation = async () => {
		// 如果正在生成，先停止生成
		if (isGenerating.value) {
			stopGeneration();
		}

		content.value = "";
		conversationHistory.value = [];
		currentTaskId.value = null;

		// 重置文件上传状态并清空文件列表
		hasUploadedFile.value = false;
		if (uploadRef.value) {
			uploadRef.value.clear();
		}

		try {
			const result = await get("/clear");
			console.log("清空对话结果：", result);
			message.success("对话已清空");
		} catch (error) {
			console.error("清空对话失败:", error);
			message.error(error.message || "清空对话失败");
		}
	};

	// 在组件卸载时清理定时器
	onUnmounted(() => {
		if (connectionCheckInterval) {
			clearInterval(connectionCheckInterval);
		}
		if (currentEvtSource) {
			currentEvtSource.close();
		}

		// 移除窗口大小变化监听
		window.removeEventListener("resize", handleResize);
	});

	// 添加一个保活机制，定期向服务器发送请求
	const keepAlive = async () => {
		if (currentTaskId.value) {
			try {
				await get(`/keepalive?taskId=${currentTaskId.value}`);
			} catch (error) {
				console.error("保活请求失败:", error);
			}
		}
	};

	// 设置保活定时器，比如每5分钟发送一次
	const keepAliveInterval = setInterval(keepAlive, 5 * 60 * 1000);

	onUnmounted(() => {
		clearInterval(keepAliveInterval);
	});

	const router = useRouter();

	// 用户菜单选项
	const userMenuOptions = computed(() => {
		return [
			{
				label: "历史记录",
				key: "history",
			},
			{
				label: "设置",
				key: "settings",
			},
			{
				type: "divider",
				key: "divider",
			},
			{
				label: "退出登录",
				key: "logout",
			},
		];
	});

	// 获取头像显示文本
	const getAvatarText = () => {
		const username = localStorage.getItem("username");
		if (!username) return "U";
		return username.charAt(0).toUpperCase();
	};

	// 处理菜单选择
	const handleSelect = (key) => {
		switch (key) {
			case "history":
				router.push("/history");
				break;
			case "settings":
				router.push("/settings");
				break;
			case "home":
				router.push("/chat");
				break;
			case "logout":
				// 清除本地存储数据
				localStorage.removeItem("userId");
				localStorage.removeItem("username");
				localStorage.removeItem("apiKey");

				// 跳转到登录页
				router.push("/login");
				break;
		}
	};

	/**
	 * 检查是否有从历史记录导入的对话
	 */
	const checkImportedConversation = async () => {
		// 首先检查后端是否有导入的对话
		try {
			const result = await get("/check-imported-conversation");

			// 如果后端返回了导入的对话
			if (result && result.hasImported && result.taskId) {
				// 清空当前对话
				conversationHistory.value = [];

				// 设置taskId
				currentTaskId.value = result.taskId;

				// 将消息添加到对话历史
				if (result.messages && result.messages.length > 0) {
					result.messages.forEach((msg) => {
						conversationHistory.value.push({
							role: msg.role,
							content: msg.content || "",
							reasoning: msg.reasoning || "",
						});
					});

					// 滚动到最新消息
					scrollToBottom();

					message.success("已成功导入历史对话");
					return; // 成功从后端导入，不再处理本地存储的对话
				}
			}
		} catch (error) {
			console.error("检查后端导入对话失败:", error);
			// 后端检查失败，继续尝试从本地存储导入
		}

		// 检查本地存储中是否有导入的对话
		const importedConversation = localStorage.getItem("importedConversation");
		const importedTaskId = localStorage.getItem("importedTaskId");

		if (importedConversation && importedTaskId) {
			try {
				// 清空当前对话
				conversationHistory.value = [];

				// 解析导入的对话
				const messages = JSON.parse(importedConversation);

				// 设置taskId
				currentTaskId.value = importedTaskId;

				// 将消息添加到对话历史
				messages.forEach((msg) => {
					conversationHistory.value.push({
						role: msg.role,
						content: msg.content || "",
						reasoning: msg.reasoning || "",
					});
				});

				// 清除导入的会话数据，防止重复导入
				localStorage.removeItem("importedConversation");
				localStorage.removeItem("importedTaskId");

				// 滚动到最新消息
				scrollToBottom();

				message.success("已成功导入历史对话");

				// 在历史记录列表中标记该对话为当前对话
				if (historyTasks.value.length > 0) {
					const activeTask = historyTasks.value.find(
						(task) => task.taskId === importedTaskId
					);
					if (activeTask) {
						// 已经存在于历史记录中，无需处理
					} else {
						// 需要刷新历史记录列表以显示该对话
						fetchHistoryTasks();
					}
				}
			} catch (error) {
				console.error("导入对话失败:", error);
				message.error("导入对话失败");
			}
		}
	};

	// 屏幕尺寸检测
	const isDesktop = ref(window.innerWidth >= 768);
	// 历史聊天相关状态
	const showHistoryInSidebar = ref(
		localStorage.getItem("showHistorySidebar") === "true"
	);
	const showHistoryDrawer = ref(false);
	const historyLoading = ref(false);
	const historyTasks = ref([]);

	// 格式化日期
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 切换侧边栏显示
	const toggleHistorySidebar = () => {
		showHistoryInSidebar.value = !showHistoryInSidebar.value;
		localStorage.setItem("showHistorySidebar", showHistoryInSidebar.value);
	};

	// 加载历史聊天记录
	const fetchHistoryTasks = async () => {
		try {
			historyLoading.value = true;

			const result = await get("/history", {
				userId: userId.value,
				limit: 50, // 获取更多历史记录用于侧边栏显示
				offset: 0,
			});

			historyTasks.value = result.tasks || [];
		} catch (error) {
			console.error("获取聊天历史失败:", error);
			message.error("获取聊天历史失败");
		} finally {
			historyLoading.value = false;
		}
	};

	// 加载历史对话详情
	const loadHistoryConversation = async (taskId) => {
		if (taskId === currentTaskId.value) return; // 如果是当前对话则不重新加载

		try {
			// 如果正在生成，先停止生成
			if (isGenerating.value) {
				stopGeneration();
			}

			// 显示加载提示
			message.loading("正在加载对话...");

			// 获取对话详情
			const result = await get(`/history/${taskId}`, {
				userId: userId.value,
			});

			// 清空当前对话
			conversationHistory.value = [];

			// 设置taskId
			currentTaskId.value = taskId;

			// 解析导入的对话
			const messages = result.messages || [];

			// 将消息添加到对话历史
			messages.forEach((msg) => {
				conversationHistory.value.push({
					role: msg.role,
					content: msg.content || "",
					reasoning: msg.reasoning || "",
				});
			});

			// 同时将对话导入到服务器
			try {
				await post("/import-messages", {
					taskId: taskId,
					messages: messages,
					userId: userId.value,
				});
				console.log("对话已成功导入到服务器");
			} catch (importError) {
				console.error("导入对话到服务器失败:", importError);
				// 导入失败不影响界面展示，所以只记录错误不显示给用户
			}

			// 滚动到最新消息
			scrollToBottom();

			message.success("已加载历史对话");
		} catch (error) {
			console.error("加载历史对话失败:", error);
			message.error("加载历史对话失败");
		}
	};

	// 确认删除历史记录
	const confirmDeleteHistory = (taskId) => {
		dialog.warning({
			title: "删除对话",
			content: "确定要删除这个对话吗？此操作不可恢复。",
			positiveText: "确定",
			negativeText: "取消",
			onPositiveClick: () => deleteHistoryTask(taskId),
		});
	};

	// 删除历史记录
	const deleteHistoryTask = async (taskId) => {
		try {
			await del(`/history/${taskId}`, {
				userId: userId.value,
			});

			message.success("对话已删除");

			// 如果删除的是当前对话，则清空当前对话
			if (taskId === currentTaskId.value) {
				clearConversation();
			}

			// 刷新历史记录列表
			fetchHistoryTasks();
		} catch (error) {
			console.error("删除对话失败:", error);
			message.error("删除对话失败");
		}
	};

	// 窗口大小变化处理
	const handleResize = () => {
		isDesktop.value = window.innerWidth >= 768;
	};
</script>

<style scoped>
	/* 主题容器类，用于监听主题变化 */
	.theme-container {
		background-color: var(--n-color-card);
		color: var(--n-text-color);
	}

	/* 深色主题特定样式 */
	.dark-theme {
		background-color: #111 !important;
		color: #eee !important;
	}

	.dark-theme .main-content,
	.dark-theme .messages,
	.dark-theme .input-area,
	.dark-theme .history-sidebar {
		background-color: #111 !important;
	}

	/* 整个页面充满视口，高度 100vh */
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background-color: var(--n-color-card);
	}

	/* 带有历史侧边栏的容器 */
	.chat-container-with-history {
		flex-direction: row;
	}

	/* 历史侧边栏 */
	.history-sidebar {
		width: 280px;
		border-right: 1px solid var(--n-border-color);
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--n-color-card);
	}

	/* 深色模式下的历史侧边栏边框 */

	.history-header {
		padding: 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--n-border-color);
	}

	.history-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.history-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.history-loading,
	.history-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
		color: var(--n-text-color-3);
	}

	.history-item {
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		/* background-color: var(--n-color-modal); */
		position: relative;
	}

	.history-item:hover {
		background-color: var(--n-color-hover);
	}

	/* 深色模式下的历史记录项目悬停状态 */
	/* .n-config-provider.n-config-provider--dark-theme .history-item:hover {
		background-color: rgba(255, 255, 255, 0.03);
	} */

	.history-item.active {
		background-color: var(--n-color-primary-fade);
	}

	.history-item-content {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		flex: 1;
	}

	.history-icon {
		margin-top: 3px;
		color: var(--n-text-color);
	}

	.history-item-info {
		flex: 1;
		overflow: hidden;
	}

	.history-time {
		font-weight: 500;
		margin-bottom: 4px;
		color: var(--n-text-color);
	}

	.history-activity {
		font-size: 12px;
		color: var(--n-text-color-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* 深色模式下的历史活动文本颜色 */
	.n-config-provider.n-config-provider--dark-theme .history-activity {
		color: var(--n-text-color-3);
	}

	.history-delete {
		opacity: 0.6;
	}

	.history-delete:hover {
		opacity: 1;
	}

	/* 主内容区域 */
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background-color: var(--n-color-card);
	}
	body.dark-theme .main-content {
		background-color: var(--n-color-card);
	}

	/* 聊天记录区域自动占满上方剩余空间，并支持滚动 */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background-color: var(--n-color-card);
	}

	/* 深色模式下的信息区域 */
	.n-config-provider.n-config-provider--dark-theme .messages {
		background-color: var(--n-color-card);
	}

	/* 输入区域始终显示在底部 */
	.input-area {
		padding: 1rem;
		background-color: var(--n-color-card);
		border-top: 1px solid var(--n-border-color);
	}

	/* 深色模式下的输入区域 */
	/* .n-config-provider.n-config-provider--dark-theme .input-area {
		background-color: var(--n-color-card);
		border-top: 1px solid rgba(255, 255, 255, 0.12);
	} */

	/* 按钮组样式 */
	.btn-group {
		margin-top: 0.5rem;
		display: flex;
		gap: 0.5rem;
	}

	/* 每条消息的行 */
	.message-row {
		display: flex;
		margin-bottom: 1rem;
	}

	/* page-header背景颜色 */
	:deep(.n-page-header) {
		background-color: var(--n-color-card);
	}

	/* 用户消息右对齐，AI 消息左对齐 */
	.message-row.user {
		justify-content: flex-end;
	}
	.message-row.assistant {
		justify-content: flex-start;
	}

	/* 消息气泡样式 */
	.message-bubble {
		max-width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		word-wrap: break-word;
		white-space: pre-wrap;
		line-height: 1.6;
		border: none; /* 确保没有边框 */
		background-color: var(--n-color-card);
		color: var(--n-text-color);
	}

	/* 用户气泡（右侧，绿色背景） */
	.user .message-bubble {
		background-color: var(--n-primary-color);
		color: white;
	}

	/* 深色模式下的用户气泡 */
	.n-config-provider.n-config-provider--dark-theme .user .message-bubble {
		background-color: var(--n-primary-color);
		color: white;
	}

	/* AI 气泡（左侧，灰色背景） */
	.assistant .message-bubble {
		background-color: var(--n-color-modal);
	}

	/* 深色模式下的AI气泡颜色 */
	.n-config-provider.n-config-provider--dark-theme .assistant .message-bubble {
		/* background-color: #2b2b2b; */
	}

	/* 代码块样式，类似ChatGPT */
	:deep(pre) {
		/* background-color: #f6f8fa; */
		border-radius: 6px;
		padding: 12px 16px;
		margin: 8px 0;
		overflow-x: auto;
		font-family:
			"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
		font-size: 16px;
		line-height: 1.45;
		border: 1px solid var(--n-border-color);
		position: relative;
	}

	/* 深色模式下的代码块样式 */
	.n-config-provider.n-config-provider--dark-theme :deep(pre) {
		/* background-color: #1e1e1e; */
		border: 1px solid var(--n-border-color);
		color: var(--n-text-color);
	}

	/* 代码行样式 */
	:deep(code) {
		font-family:
			"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
		font-size: 16px;
		padding: 2px 4px;
		border-radius: 3px;
		/* background-color: rgba(27, 31, 35, 0.05); */
		color: var(--n-text-color);
	}

	/* 深色模式下的内联代码样式 */
	.n-config-provider.n-config-provider--dark-theme :deep(code) {
		background-color: var(--n-color-hover);
		color: var(--n-text-color);
	}

	/* 代码块内的代码不需要额外背景色 */
	:deep(pre code) {
		/* background-color: transparent; */
		padding: 0;
		border-radius: 0;
		white-space: pre;
		color: var(--n-text-color);
	}

	/* 深色模式下代码块内的代码 */
	.n-config-provider.n-config-provider--dark-theme :deep(pre code) {
		color: var(--n-text-color);
	}

	/* 语法高亮基础样式 */
	.message-bubble :deep(.hljs-keyword),
	.message-bubble :deep(.hljs-selector-tag),
	.message-bubble :deep(.hljs-subst) {
		color: #d73a49;
		font-weight: bold;
	}

	/* 深色模式下的语法高亮 */
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-keyword),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-selector-tag),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-subst) {
		color: #ff7b72;
		font-weight: bold;
	}

	.message-bubble :deep(.hljs-string),
	.message-bubble :deep(.hljs-doctag) {
		color: #032f62;
	}

	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-string),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-doctag) {
		color: #a5d6ff;
	}

	.message-bubble :deep(.hljs-title),
	.message-bubble :deep(.hljs-section),
	.message-bubble :deep(.hljs-selector-id) {
		color: #6f42c1;
		font-weight: bold;
	}

	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-title),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-section),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-selector-id) {
		color: #d2a8ff;
		font-weight: bold;
	}

	.message-bubble :deep(.hljs-comment),
	.message-bubble :deep(.hljs-quote) {
		color: #6a737d;
		font-style: italic;
	}

	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-comment),
	.n-config-provider.n-config-provider--dark-theme
		.message-bubble
		:deep(.hljs-quote) {
		color: #8b949e;
		font-style: italic;
	}

	.message-bubble :deep(.hljs-variable),
	.message-bubble :deep(.hljs-template-variable),
	.message-bubble :deep(.hljs-attribute),
	.message-bubble :deep(.hljs-tag),
	.message-bubble :deep(.hljs-name),
	.message-bubble :deep(.hljs-regexp),
	.message-bubble :deep(.hljs-link) {
		color: #005cc5;
	}

	.message-bubble :deep(.hljs-number),
	.message-bubble :deep(.hljs-meta),
	.message-bubble :deep(.hljs-built_in),
	.message-bubble :deep(.hljs-builtin-name),
	.message-bubble :deep(.hljs-literal),
	.message-bubble :deep(.hljs-type),
	.message-bubble :deep(.hljs-params) {
		color: #e36209;
	}

	.message-bubble :deep(.hljs-symbol),
	.message-bubble :deep(.hljs-bullet) {
		color: var(--n-text-color);
	}

	.message-bubble :deep(.hljs-deletion) {
		/* background-color: #ffeef0; */
	}

	.message-bubble :deep(.hljs-addition) {
		background-color: #f0fff4;
	}

	/* 响应式：手机端样式调整 */
	@media (max-width: 768px) {
		.message-bubble {
			max-width: 85%;
		}

		.chat-container {
			flex-direction: column;
		}

		.history-sidebar {
			display: none; /* 移动端隐藏侧边栏 */
		}
	}

	:deep() .n-upload-trigger.n-upload-trigger--image-card {
		height: 48px;
		width: 48px;
	}
	:deep() .n-upload-file-list .n-upload-file.n-upload-file--image-card-type {
		height: 48px;
		width: 48px;
	}
	:deep() .n-upload-file-list.n-upload-file-list--grid {
		grid-template-columns: repeat(auto-fill, 48px);
	}
</style>
