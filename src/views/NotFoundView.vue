<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-desc">您访问的页面不存在或已被移除</p>
      <n-button type="primary" size="large" @click="goHome">
        返回首页
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { NButton } from "naive-ui";

const router = useRouter();

const goHome = () => {
  router.push("/chat");
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(to right, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  margin: 20px 0;
}

.error-desc {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.8;
}
</style>
