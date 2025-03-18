<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { get } from "@/utils/request";

const router = useRouter();

// 全局登录检查函数
const checkLoginStatus = async () => {
  // 如果当前已在登录页面，无需检查
  if (router.currentRoute.value.name === "login") return;

  const userId = localStorage.getItem("userId");
  const apiKey = localStorage.getItem("apiKey");

  // 如果本地没有登录信息，直接跳转登录页
  if (!userId || !apiKey) {
    clearUserData();
    router.push("/login");
    return;
  }

  try {
    // 验证API密钥有效性 (这里可以根据实际接口调整)
    const result = await get(`/verify-api-key?apiKey=${apiKey}`);

    // 如果验证失败
    if (!result.valid) {
      clearUserData();
      router.push("/login");
    }
  } catch (error) {
    console.error("验证用户登录状态失败:", error);
    // 出错时保持登录状态，不自动登出用户
  }
};

// 清除用户数据
const clearUserData = () => {
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("apiKey");
};

// 页面加载时检查登录状态
onMounted(() => {
  checkLoginStatus();

  // 添加全局错误拦截，处理401/403响应
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    // 如果收到401或403响应，可能是授权失效
    if (response.status === 401 || response.status === 403) {
      // 避免在登录相关页面触发重定向
      const currentRoute = router.currentRoute.value;
      if (currentRoute.name !== "login") {
        clearUserData();
        router.push("/login");
      }
    }

    return response;
  };
});
</script>

<template>
  <!-- <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" /> -->

  <!-- <div class="wrapper">

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div> -->
  <n-dialog-provider>
    <n-message-provider>
      <RouterView />
    </n-message-provider>
  </n-dialog-provider>
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
</style>
