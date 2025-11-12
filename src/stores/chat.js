import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 聊天状态管理
 */
export const useChatStore = defineStore('chat', () => {
  // 状态
  const messages = ref([]);
  const currentSessionId = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // 计算属性
  const messageCount = computed(() => messages.value.length);
  const hasMessages = computed(() => messages.value.length > 0);
  const lastMessage = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  );

  // 操作
  function addMessage(message) {
    messages.value.push({
      ...message,
      timestamp: Date.now()
    });
  }

  function updateMessage(index, updates) {
    if (index >= 0 && index < messages.value.length) {
      messages.value[index] = {
        ...messages.value[index],
        ...updates
      };
    }
  }

  function clearMessages() {
    messages.value = [];
    error.value = null;
  }

  function setSessionId(sessionId) {
    currentSessionId.value = sessionId;
  }

  function setLoading(loading) {
    isLoading.value = loading;
  }

  function setError(err) {
    error.value = err;
  }

  function removeMessage(index) {
    if (index >= 0 && index < messages.value.length) {
      messages.value.splice(index, 1);
    }
  }

  function getMessagesByRole(role) {
    return messages.value.filter(msg => msg.role === role);
  }

  return {
    // 状态
    messages,
    currentSessionId,
    isLoading,
    error,

    // 计算属性
    messageCount,
    hasMessages,
    lastMessage,

    // 操作
    addMessage,
    updateMessage,
    clearMessages,
    setSessionId,
    setLoading,
    setError,
    removeMessage,
    getMessagesByRole
  };
});
