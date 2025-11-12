import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const userId = ref(localStorage.getItem('userId') || null);
  const username = ref(localStorage.getItem('username') || null);
  const apiKey = ref(localStorage.getItem('apiKey') || null);
  const isLoggedIn = ref(!!localStorage.getItem('apiKey'));

  // 计算属性
  const userInfo = computed(() => ({
    userId: userId.value,
    username: username.value,
    apiKey: apiKey.value,
    isLoggedIn: isLoggedIn.value
  }));

  // 操作
  function login(userData) {
    userId.value = userData.id;
    username.value = userData.username;
    apiKey.value = userData.api_key;
    isLoggedIn.value = true;

    // 持久化到 localStorage
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('apiKey', userData.api_key);
  }

  function logout() {
    userId.value = null;
    username.value = null;
    apiKey.value = null;
    isLoggedIn.value = false;

    // 清除 localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('apiKey');
  }

  function updateUserInfo(updates) {
    if (updates.username !== undefined) {
      username.value = updates.username;
      localStorage.setItem('username', updates.username);
    }
    if (updates.apiKey !== undefined) {
      apiKey.value = updates.apiKey;
      localStorage.setItem('apiKey', updates.apiKey);
    }
  }

  return {
    // 状态
    userId,
    username,
    apiKey,
    isLoggedIn,

    // 计算属性
    userInfo,

    // 操作
    login,
    logout,
    updateUserInfo
  };
});
