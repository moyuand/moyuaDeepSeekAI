import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import logger from '@/utils/logger';

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
    try {
      userId.value = userData.id;
      username.value = userData.username;
      apiKey.value = userData.api_key;
      isLoggedIn.value = true;

      // 持久化到 localStorage
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('apiKey', userData.api_key);

      logger.info('User logged in', {
        userId: userData.id,
        username: userData.username
      });
    } catch (error) {
      logger.error('Failed to login', error);
      throw error;
    }
  }

  function logout() {
    try {
      const prevUserId = userId.value;

      userId.value = null;
      username.value = null;
      apiKey.value = null;
      isLoggedIn.value = false;

      // 清除 localStorage 中的用户信息
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('apiKey');

      // 清除当前会话记录
      localStorage.removeItem('currentSession');

      logger.info('User logged out', { userId: prevUserId });
    } catch (error) {
      logger.error('Failed to logout', error);
      throw error;
    }
  }

  function updateUserInfo(updates) {
    try {
      if (updates.username !== undefined) {
        username.value = updates.username;
        localStorage.setItem('username', updates.username);
        logger.info('Username updated', { username: updates.username });
      }
      if (updates.apiKey !== undefined) {
        apiKey.value = updates.apiKey;
        localStorage.setItem('apiKey', updates.apiKey);
        logger.info('API key updated');
      }
    } catch (error) {
      logger.error('Failed to update user info', error);
      throw error;
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
