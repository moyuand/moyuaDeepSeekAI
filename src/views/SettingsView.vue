<template>
	<div class="settings-container">
		<n-card class="settings-card">
			<template #header>
				<div class="card-header">
					<h1 class="title">个人设置</h1>
					<n-button @click="goBack" quaternary circle>
						<template #icon>
							<n-icon size="20">
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
			</template>

			<n-tabs type="line" animated>
				<n-tab-pane name="profile" tab="个人资料">
					<n-form
						ref="profileFormRef"
						:model="profileForm"
						:rules="profileRules"
						label-placement="left"
						label-width="80"
						require-mark-placement="right-hanging"
					>
						<n-form-item label="用户名" path="username">
							<n-input
								v-model:value="profileForm.username"
								placeholder="用户名"
							/>
						</n-form-item>
						<n-form-item label="邮箱" path="email">
							<n-input
								v-model:value="profileForm.email"
								placeholder="电子邮箱"
							/>
						</n-form-item>
						<n-form-item>
							<n-button
								type="primary"
								@click="updateProfile"
								:loading="loading"
							>
								保存修改
							</n-button>
						</n-form-item>
					</n-form>
				</n-tab-pane>

				<n-tab-pane name="security" tab="安全设置">
					<div class="mb-8">
						<h3 class="section-title">修改密码</h3>
						<n-form
							ref="passwordFormRef"
							:model="passwordForm"
							:rules="passwordRules"
							label-placement="left"
							label-width="100"
							require-mark-placement="right-hanging"
						>
							<n-form-item label="当前密码" path="currentPassword">
								<n-input
									v-model:value="passwordForm.currentPassword"
									type="password"
									show-password-on="click"
									placeholder="当前密码"
								/>
							</n-form-item>
							<n-form-item label="新密码" path="newPassword">
								<n-input
									v-model:value="passwordForm.newPassword"
									type="password"
									show-password-on="click"
									placeholder="新密码"
								/>
							</n-form-item>
							<n-form-item label="确认新密码" path="confirmPassword">
								<n-input
									v-model:value="passwordForm.confirmPassword"
									type="password"
									show-password-on="click"
									placeholder="确认新密码"
								/>
							</n-form-item>
							<n-form-item>
								<n-button
									type="primary"
									@click="updatePassword"
									:loading="loading"
								>
									更新密码
								</n-button>
							</n-form-item>
						</n-form>
					</div>

					<div class="mt-8">
						<h3 class="section-title">API密钥</h3>
						<div class="api-key-section">
							<div class="api-key-display">
								<n-input
									v-model:value="apiKey"
									type="password"
									show-password-on="click"
									:disabled="true"
									placeholder="API密钥"
								/>
							</div>
							<n-button type="warning" @click="confirmResetApiKey">
								重置API密钥
							</n-button>
						</div>
					</div>
				</n-tab-pane>

				<n-tab-pane name="appearance" tab="外观设置">
					<div class="mb-4">
						<h3 class="section-title">主题</h3>
						<n-radio-group v-model:value="themeValue" name="theme">
							<n-space>
								<n-radio-button value="light">浅色</n-radio-button>
								<n-radio-button value="dark">深色</n-radio-button>
								<n-radio-button value="system">跟随系统</n-radio-button>
							</n-space>
						</n-radio-group>
					</div>

					<div class="mt-6">
						<h3 class="section-title">语言</h3>
						<n-select
							v-model:value="language"
							:options="languageOptions"
							style="width: 200px"
						/>
					</div>

					<div class="mt-6">
						<h3 class="section-title">打字速度</h3>
						<div class="typing-speed-control">
							<n-slider
								v-model:value="typingSpeed"
								:min="0"
								:max="100"
								:step="10"
								:marks="typingSpeedMarks"
								:tooltip="true"
								:format-tooltip="formatSpeedTooltip"
								style="flex: 1"
							/>
							<div class="speed-description">
								{{ getSpeedDescription(typingSpeed) }}
							</div>
						</div>
					</div>
				</n-tab-pane>
			</n-tabs>
		</n-card>
	</div>
</template>

<script setup>
	import { ref, onMounted, watch } from "vue";
	import { useRouter } from "vue-router";
	import { useMessage, useDialog } from "naive-ui";
	import { get, post, put } from "@/utils/request";
	import { getErrorMessage } from "@/constants/errorCodes";
	import { useThemeStore } from "@/stores";

	const router = useRouter();
	const message = useMessage();
	const dialog = useDialog();
	const loading = ref(false);
	const themeStore = useThemeStore();

	// 个人资料表单
	const profileForm = ref({
		username: "",
		email: "",
	});

	const profileRules = {
		username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
		email: [
			{ required: true, message: "请输入邮箱", trigger: "blur" },
			{ type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
		],
	};

	// 密码表单
	const passwordForm = ref({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const passwordRules = {
		currentPassword: [
			{ required: true, message: "请输入当前密码", trigger: "blur" },
		],
		newPassword: [
			{ required: true, message: "请输入新密码", trigger: "blur" },
			{ min: 6, message: "密码至少需要6个字符", trigger: "blur" },
		],
		confirmPassword: [
			{ required: true, message: "请确认新密码", trigger: "blur" },
			{
				validator: (rule, value) => {
					return value === passwordForm.value.newPassword;
				},
				message: "两次输入的密码不一致",
				trigger: "blur",
			},
		],
	};

	// API 密钥
	const apiKey = ref("");
	const userId = ref("");

	// 更新主题变量，绑定到全局状态
	const themeValue = ref(themeStore.themeMode || "light");

	// 主题设置
	const language = ref("zh-CN");
	const languageOptions = [
		{ label: "简体中文", value: "zh-CN" },
		{ label: "English", value: "en-US" },
	];

	// 打字速度设置 (0=即时显示, 100=最慢)
	const typingSpeed = ref(30);
	const typingSpeedMarks = {
		0: "即时",
		50: "中速",
		100: "慢速",
	};

	const formatSpeedTooltip = (value) => {
		if (value === 0) return "即时显示";
		if (value <= 20) return "非常快";
		if (value <= 40) return "快速";
		if (value <= 60) return "中等";
		if (value <= 80) return "较慢";
		return "最慢";
	};

	const getSpeedDescription = (value) => {
		if (value === 0) return "AI回复将立即全部显示";
		if (value <= 30) return "快速打字效果,适合快速阅读";
		if (value <= 60) return "标准打字效果,自然流畅";
		return "慢速打字效果,便于逐字理解";
	};

	// 监听主题变化
	const updateTheme = async (value) => {
		try {
			await post("/settings/theme", {
				userId: userId.value,
				value,
			});
		} catch (error) {
			console.error("更新主题设置失败:", error);
		}
	};

	// 监听语言变化
	const updateLanguage = async (value) => {
		try {
			await post("/settings/language", {
				userId: userId.value,
				value,
			});
		} catch (error) {
			console.error("更新语言设置失败:", error);
		}
	};

	// 监听打字速度变化
	const updateTypingSpeed = async (value) => {
		try {
			// 保存到localStorage供对话页面使用
			localStorage.setItem("typingSpeed", value.toString());

			// 保存到后端数据库
			await post("/settings/typingSpeed", {
				userId: userId.value,
				value,
			});
		} catch (error) {
			console.error("更新打字速度设置失败:", error);
		}
	};

	// 主题变化时同步更新全局主题
	watch(themeValue, (newValue) => {
		// 更新全局主题
		themeStore.setThemeMode(newValue);

		// 保存到用户设置
		updateTheme(newValue);
	});

	// 替换原来的watch监听
	watch(language, updateLanguage);

	// 监听打字速度变化
	watch(typingSpeed, updateTypingSpeed);

	// 返回上一页
	const goBack = () => {
		router.push("/chat");
	};

	// 加载用户信息
	const loadUserInfo = async () => {
		try {
			const storedUserId = localStorage.getItem("userId");
			if (!storedUserId) {
				message.error("未登录用户");
				router.push("/login");
				return;
			}

			userId.value = storedUserId;

			// 获取用户信息
			const userResult = await get(`/user/${userId.value}`);
			profileForm.value.username = userResult.username;
			profileForm.value.email = userResult.email;

			// 获取API密钥
			apiKey.value = localStorage.getItem("apiKey") || "";

			// 获取用户设置
			try {
				const settingsResult = await get(`/settings?userId=${userId.value}`);
				if (settingsResult && settingsResult.settings) {
					// 更新主题值并同步到全局
					const savedTheme = settingsResult.settings.theme || "light";
					themeValue.value = savedTheme;
					// 同步到全局主题
					themeStore.setThemeMode(savedTheme);

					language.value = settingsResult.settings.language || "zh-CN";

					// 加载打字速度设置
					const savedTypingSpeed =
						settingsResult.settings.typingSpeed !== undefined
							? parseInt(settingsResult.settings.typingSpeed)
							: 30;
					typingSpeed.value = savedTypingSpeed;
					localStorage.setItem("typingSpeed", savedTypingSpeed.toString());
				} else {
					// 如果没有设置数据，使用默认值
					console.log("未找到用户设置，使用默认值");
					const defaultTheme = themeStore.themeMode || "light";
					themeValue.value = defaultTheme;
					themeStore.setThemeMode(defaultTheme);
					language.value = "zh-CN";
					typingSpeed.value = 30;
					localStorage.setItem("typingSpeed", "30");
				}
			} catch (settingsError) {
				// 如果获取设置失败，使用默认值，不影响主流程
				console.warn("获取用户设置失败，使用默认值:", settingsError);
				const defaultTheme = themeStore.themeMode || "light";
				themeValue.value = defaultTheme;
				themeStore.setThemeMode(defaultTheme);
				language.value = "zh-CN";
				typingSpeed.value = 30;
				localStorage.setItem("typingSpeed", "30");
			}
		} catch (error) {
			console.error("加载用户信息失败:", error);
			message.error("获取用户信息失败");
		}
	};

	// 更新个人资料
	const updateProfile = async () => {
		try {
			loading.value = true;

			await put(`/user/${userId.value}`, {
				username: profileForm.value.username,
				email: profileForm.value.email,
			});

			message.success("个人资料更新成功");
			localStorage.setItem("username", profileForm.value.username);
		} catch (error) {
			console.error("更新个人资料失败:", error);
			const errorMsg = error.code
				? getErrorMessage(error.code, error.message)
				: (error.message || "更新失败，请稍后再试");
			message.error(errorMsg);
		} finally {
			loading.value = false;
		}
	};

	// 更新密码
	const updatePassword = async () => {
		try {
			loading.value = true;

			await put(`/user/${userId.value}`, {
				password: passwordForm.value.newPassword,
				current_password: passwordForm.value.currentPassword,
			});

			message.success("密码更新成功，请重新登录");

			// 清除用户登录信息
			localStorage.removeItem("userId");
			localStorage.removeItem("username");
			localStorage.removeItem("apiKey");

			// 跳转到登录页
			setTimeout(() => {
				router.push("/login");
			}, 1500); // 延迟1.5秒，让用户看到成功消息
		} catch (error) {
			console.error("更新密码失败:", error);
			const errorMsg = error.code
				? getErrorMessage(error.code, error.message)
				: (error.message || "更新失败，请检查当前密码是否正确");
			message.error(errorMsg);
		} finally {
			loading.value = false;
		}
	};

	// 确认重置API密钥
	const confirmResetApiKey = () => {
		dialog.warning({
			title: "重置API密钥",
			content: "重置API密钥后，之前的密钥将失效。确定要重置吗？",
			positiveText: "确定",
			negativeText: "取消",
			onPositiveClick: resetApiKey,
		});
	};

	// 重置API密钥
	const resetApiKey = async () => {
		try {
			loading.value = true;

			const result = await post(`/user/${userId.value}/reset-api-key`);

			apiKey.value = result.api_key;
			localStorage.setItem("apiKey", result.api_key);

			message.success("API密钥重置成功");
		} catch (error) {
			console.error("重置API密钥失败:", error);
			const errorMsg = error.code
				? getErrorMessage(error.code, error.message)
				: (error.message || "重置失败，请稍后再试");
			message.error(errorMsg);
		} finally {
			loading.value = false;
		}
	};

	onMounted(() => {
		loadUserInfo();
	});
</script>

<style scoped>
	.settings-container {
		max-width: 100vw;
		/* margin: 20px auto; */
		padding: 20px 16px;
		height: 100vh;
		background-color: var(--n-color-card);
	}

	.settings-card {
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title {
		font-size: 20px;
		font-weight: 600;
		color: #333;
		margin: 0;
	}

	.section-title {
		font-size: 16px;
		font-weight: 500;
		color: #555;
		margin-bottom: 16px;
	}

	.api-key-section {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.api-key-display {
		flex: 1;
	}

	.typing-speed-control {
		max-width: 500px;
	}

	.speed-description {
		margin-top: 12px;
		font-size: 14px;
		color: var(--n-text-color-disabled);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.api-key-section {
			flex-direction: column;
			align-items: stretch;
			gap: 8px;
		}
	}
</style>
