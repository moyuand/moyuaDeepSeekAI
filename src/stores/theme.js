import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { darkTheme } from 'naive-ui';
import { useOsTheme } from 'naive-ui';

/**
 * 主题状态管理
 */
export const useThemeStore = defineStore('theme', () => {
  const osTheme = useOsTheme();

  // 状态
  const themeMode = ref(localStorage.getItem('themeMode') || 'light'); // 'light', 'dark', 'system'

  // 计算属性
  const currentTheme = computed(() => {
    if (themeMode.value === 'system') {
      return osTheme.value === 'dark' ? darkTheme : null;
    }
    return themeMode.value === 'dark' ? darkTheme : null;
  });

  const isDark = computed(() => {
    if (themeMode.value === 'system') {
      return osTheme.value === 'dark';
    }
    return themeMode.value === 'dark';
  });

  // 操作
  function setThemeMode(mode) {
    if (['light', 'dark', 'system'].includes(mode)) {
      themeMode.value = mode;
      localStorage.setItem('themeMode', mode);
    }
  }

  function toggleTheme() {
    if (themeMode.value === 'light') {
      setThemeMode('dark');
    } else if (themeMode.value === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
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
