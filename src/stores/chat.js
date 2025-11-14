import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import logger from '@/utils/logger';

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
    try {
      const newMessage = {
        ...message,
        timestamp: Date.now()
      };
      messages.value.push(newMessage);
      logger.debug('Message added', {
        role: message.role,
        sessionId: currentSessionId.value
      });
    } catch (error) {
      logger.error('Failed to add message', error);
      throw error;
    }
  }

  function updateMessage(index, updates) {
    try {
      if (index >= 0 && index < messages.value.length) {
        messages.value[index] = {
          ...messages.value[index],
          ...updates
        };
        logger.debug('Message updated', { index });
      } else {
        logger.warn('Invalid message index', { index });
      }
    } catch (error) {
      logger.error('Failed to update message', error);
      throw error;
    }
  }

  function clearMessages() {
    try {
      const count = messages.value.length;
      messages.value = [];
      error.value = null;
      logger.info('Messages cleared', { count });
    } catch (error) {
      logger.error('Failed to clear messages', error);
      throw error;
    }
  }

  function setSessionId(sessionId) {
    try {
      currentSessionId.value = sessionId;
      logger.debug('Session ID set', { sessionId });
    } catch (error) {
      logger.error('Failed to set session ID', error);
      throw error;
    }
  }

  function setLoading(loading) {
    isLoading.value = loading;
    logger.debug('Loading state changed', { loading });
  }

  function setError(err) {
    error.value = err;
    if (err) {
      logger.error('Chat error set', err);
    }
  }

  function removeMessage(index) {
    try {
      if (index >= 0 && index < messages.value.length) {
        messages.value.splice(index, 1);
        logger.debug('Message removed', { index });
      } else {
        logger.warn('Invalid message index for removal', { index });
      }
    } catch (error) {
      logger.error('Failed to remove message', error);
      throw error;
    }
  }

  function getMessagesByRole(role) {
    try {
      return messages.value.filter(msg => msg.role === role);
    } catch (error) {
      logger.error('Failed to get messages by role', error);
      return [];
    }
  }

  // 会话持久化方法
  function saveCurrentSession() {
    try {
      const session = {
        sessionId: currentSessionId.value,
        messages: messages.value,
        timestamp: Date.now()
      };
      localStorage.setItem('currentSession', JSON.stringify(session));
      logger.debug('Current session saved', {
        sessionId: session.sessionId,
        messageCount: messages.value.length
      });
    } catch (error) {
      logger.error('Failed to save current session', error);
    }
  }

  function restoreSession() {
    try {
      const saved = localStorage.getItem('currentSession');
      if (!saved) {
        logger.debug('No session to restore');
        return false;
      }

      const session = JSON.parse(saved);
      const age = Date.now() - session.timestamp;
      const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

      if (age < SESSION_EXPIRY) {
        currentSessionId.value = session.sessionId;
        messages.value = session.messages;
        logger.info('Session restored', {
          sessionId: session.sessionId,
          messageCount: session.messages.length,
          age: Math.round(age / 1000 / 60) + ' minutes'
        });
        return true;
      } else {
        localStorage.removeItem('currentSession');
        logger.info('Session expired and cleared', {
          age: Math.round(age / 1000 / 60 / 60) + ' hours'
        });
        return false;
      }
    } catch (error) {
      logger.error('Failed to restore session', error);
      localStorage.removeItem('currentSession');
      return false;
    }
  }

  function clearPersistedSession() {
    try {
      localStorage.removeItem('currentSession');
      logger.debug('Persisted session cleared');
    } catch (error) {
      logger.error('Failed to clear persisted session', error);
    }
  }

  function startNewChat() {
    try {
      clearMessages();
      clearPersistedSession();
      currentSessionId.value = null;
      logger.info('New chat started');
    } catch (error) {
      logger.error('Failed to start new chat', error);
      throw error;
    }
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
    getMessagesByRole,

    // 会话持久化
    saveCurrentSession,
    restoreSession,
    clearPersistedSession,
    startNewChat
  };
});
