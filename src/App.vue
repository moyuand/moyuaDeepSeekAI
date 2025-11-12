<script setup>
	import { onMounted } from "vue";
	import { useRouter } from "vue-router";
	import { get } from "@/utils/request";
	import {
		NConfigProvider,
		NDialogProvider,
		NMessageProvider,
	} from "naive-ui";
	import { useUserStore, useThemeStore } from "@/stores";

	const router = useRouter();
	const userStore = useUserStore();
	const themeStore = useThemeStore();

	// 全局登录检查函数
	const checkLoginStatus = async () => {
		// 如果当前已在登录页面，无需检查
		if (router.currentRoute.value.name === "login") return;

		// 如果本地没有登录信息，设置登录状态为false
		if (!userStore.isLoggedIn || !userStore.apiKey) {
			userStore.logout();

			// 如果不在登录页，则导航到登录页
			if (router.currentRoute.value.name !== "login") {
				router.push("/login");
			}
			return;
		}

		try {
			// 验证API密钥有效性
			const result = await get(`/verify-api-key?apiKey=${userStore.apiKey}`);

			// 如果验证失败
			if (!result.valid) {
				userStore.logout();

				// 如果不在登录页，则导航到登录页
				if (router.currentRoute.value.name !== "login") {
					router.push("/login");
				}
			}
		} catch (error) {
			console.error("验证用户登录状态失败:", error);
			// 出错时保持登录状态，不自动登出用户
		}
	};

	// 页面加载时检查登录状态
	onMounted(() => {
		checkLoginStatus();
		// ✅ 已移除全局fetch拦截,401/403错误处理已在request.js的axios拦截器中实现
	});
</script>

<template>
	<n-config-provider :theme="themeStore.currentTheme">
		<n-dialog-provider>
			<n-message-provider>
				<!-- 现有的应用内容 -->
				<router-view />
			</n-message-provider>
		</n-dialog-provider>
	</n-config-provider>
</template>

<style scoped>
	/* header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
} */

	/* .input-area {
		background-color: var(--n-color-card);
		border-top: 1px solid var(--n-border-color);
	} */
</style>
