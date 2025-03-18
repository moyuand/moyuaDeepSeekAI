<template>
  <div class="login-container">
    <div class="login-box">
      <div class="header">
        <h1 class="title">墨鱼AI</h1>
        <p class="subtitle">智能助手，随时为您服务</p>
      </div>

      <n-card class="login-card">
        <n-tabs v-model:value="activeTab" default-value="login" animated>
          <n-tab-pane name="login" tab="登录">
            <n-form ref="loginFormRef" :model="loginForm">
              <n-form-item label="用户名" path="username">
                <n-input
                  v-model:value="loginForm.username"
                  placeholder="请输入用户名"
                />
              </n-form-item>
              <n-form-item label="密码" path="password">
                <n-input
                  v-model:value="loginForm.password"
                  type="password"
                  show-password-on="click"
                  placeholder="请输入密码"
                />
              </n-form-item>
              <n-form-item>
                <n-button
                  type="primary"
                  block
                  @click="handleLogin"
                  :loading="loading"
                >
                  登录
                </n-button>
              </n-form-item>
            </n-form>
            <div class="flex justify-between mt-4">
              <n-button text @click="goToRegister">
                没有账号？立即注册
              </n-button>
              <n-button text> 忘记密码？ </n-button>
            </div>
          </n-tab-pane>
          <n-tab-pane name="register" tab="注册">
            <n-form ref="registerFormRef" :model="registerForm">
              <n-form-item label="用户名" path="username">
                <n-input
                  v-model:value="registerForm.username"
                  placeholder="请输入用户名"
                />
              </n-form-item>
              <n-form-item label="邮箱" path="email">
                <n-input
                  v-model:value="registerForm.email"
                  placeholder="请输入邮箱"
                />
              </n-form-item>
              <n-form-item label="密码" path="password">
                <n-input
                  v-model:value="registerForm.password"
                  type="password"
                  show-password-on="click"
                  placeholder="请输入密码"
                />
              </n-form-item>
              <n-form-item label="确认密码" path="confirmPassword">
                <n-input
                  v-model:value="registerForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="请再次输入密码"
                />
              </n-form-item>
              <n-form-item>
                <n-button
                  type="primary"
                  block
                  @click="handleRegister"
                  :loading="loading"
                >
                  注册
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { post } from "@/utils/request";

const router = useRouter();
const message = useMessage();
const loading = ref(false);

const loginForm = ref({
  username: "",
  password: "",
});

const registerForm = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const activeTab = ref("login");

const handleLogin = async () => {
  try {
    loading.value = true;
    const result = await post("/login", {
      username: loginForm.value.username,
      password: loginForm.value.password,
    });

    // 登录成功，保存用户信息到本地存储
    localStorage.setItem("userId", result.id);
    localStorage.setItem("username", result.username);
    localStorage.setItem("apiKey", result.api_key);

    message.success("登录成功");
    router.push("/chat");
  } catch (error) {
    console.error("登录失败:", error);
    message.error(error.message || "登录失败，请检查用户名和密码");
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  // 检查两次密码是否一致
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    message.error("两次输入的密码不一致");
    return;
  }

  try {
    loading.value = true;
    const result = await post("/register", {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
    });

    // 注册成功，保存用户信息到本地存储
    localStorage.setItem("userId", result.id);
    localStorage.setItem("username", result.username);
    localStorage.setItem("apiKey", result.api_key);

    message.success("注册成功");
    router.push("/chat");
  } catch (error) {
    console.error("注册失败:", error);
    message.error(error.message || "注册失败，请稍后再试");
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  activeTab.value = "register";
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-box {
  width: 100%;
  max-width: 480px;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
