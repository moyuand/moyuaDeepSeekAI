import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { darkTheme, useOsTheme } from 'naive-ui';
import logger from '@/utils/logger';

/**
 * 主题状态管理
 */
export const useThemeStore = defineStore('theme', () => {
  const osTheme = useOsTheme();

  // 状态
  const themeMode = ref(localStorage.getItem('themeMode') || 'light'); // 'light', 'dark', 'system'

  const resolveTheme = () => {
    if (themeMode.value === 'system') {
      return osTheme.value === 'dark' ? 'dark' : 'light';
    }
    return themeMode.value;
  };

  const syncDocumentTheme = () => {
    if (typeof document === 'undefined') return;
    const resolved = resolveTheme();
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-theme', resolved);
    body?.classList.toggle('dark-theme', resolved === 'dark');
  };

  watch([themeMode, osTheme], syncDocumentTheme, { immediate: true });

  const currentTheme = computed(() => {
    return resolveTheme() === 'dark' ? darkTheme : null;
  });

  const isDark = computed(() => {
    return resolveTheme() === 'dark';
  });

  // 操作
  function setThemeMode(mode) {
    try {
      if (['light', 'dark', 'system'].includes(mode)) {
        themeMode.value = mode;
        localStorage.setItem('themeMode', mode);
        syncDocumentTheme();
        logger.debug('Theme mode changed', { mode });
      } else {
        logger.warn('Invalid theme mode', { mode });
      }
    } catch (error) {
      logger.error('Failed to set theme mode', error);
      throw error;
    }
  }

  function toggleTheme() {
    try {
      // 简化为只在light和dark之间切换
      if (themeMode.value === 'light') {
        setThemeMode('dark');
      } else {
        setThemeMode('light');
      }
      logger.debug('Theme toggled', { newMode: themeMode.value });
    } catch (error) {
      logger.error('Failed to toggle theme', error);
      throw error;
    }
  }

  return {
    // 状态
    themeMode,

    // 计算属性
    currentTheme,
    isDark,

    // 操作
    setThemeMode,
    toggleTheme
  };
});
