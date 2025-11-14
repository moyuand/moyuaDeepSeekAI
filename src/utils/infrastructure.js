/**
 * 基础设施初始化模块
 * 统一初始化和连接所有基础设施组件
 */

import logger, { LogLevel } from './logger'
import errorHandler from './errorHandler'

/**
 * 初始化基础设施
 * @param {Object} options - 初始化选项
 */
export function initializeInfrastructure(options = {}) {
  // 1. 配置日志系统
  const loggerOptions = {
    level: import.meta.env.MODE === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    enableConsole: true,
    enableCache: true,
    cacheLimit: options.logCacheLimit || 1000,
    enableServerReport: import.meta.env.MODE === 'production',
    serverReportUrl: options.logReportUrl || '/api/logs',
    ...options.logger
  }

  // 应用logger配置
  if (loggerOptions.level !== undefined) {
    logger.setLevel(loggerOptions.level)
  }

  // 设置应用上下文
  const context = {
    appName: 'moyuDeepSeekAI',
    appVersion: '1.0.0',
    environment: import.meta.env.MODE,
    userId: localStorage.getItem('userId') || 'anonymous',
    ...options.context
  }
  logger.setContext(context)

  // 2. 将logger注入到errorHandler
  errorHandler.setLogger(logger)

  // 3. 记录初始化完成
  logger.info('Infrastructure initialized successfully', {
    mode: import.meta.env.MODE,
    logLevel: loggerOptions.level
  })

  // 4. 设置全局错误处理
  setupGlobalErrorHandlers()

  // 5. 设置性能监控（如果在生产环境）
  if (import.meta.env.MODE === 'production') {
    setupPerformanceMonitoring()
  }

  return {
    logger,
    errorHandler
  }
}

/**
 * 设置全局错误处理器
 */
function setupGlobalErrorHandlers() {
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    })

    // 阻止默认的控制台错误输出
    event.preventDefault()

    // 使用errorHandler处理
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    errorHandler.handle(error, { type: 'unhandledRejection' })
  })

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    logger.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })

    // 使用errorHandler处理
    if (event.error) {
      errorHandler.handle(event.error, {
        type: 'globalError',
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      })
    }
  })

  logger.debug('Global error handlers set up')
}

/**
 * 设置性能监控
 */
function setupPerformanceMonitoring() {
  // 监控页面加载性能
  if (typeof window !== 'undefined' && window.performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart
        const firstPaintTime = perfData.responseStart - perfData.navigationStart

        logger.info('Page Performance Metrics', {
          pageLoadTime,
          domReadyTime,
          firstPaintTime,
          dnsTime: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcpTime: perfData.connectEnd - perfData.connectStart,
          requestTime: perfData.responseEnd - perfData.requestStart
        })

        // 检查性能指标是否符合要求
        if (pageLoadTime > 3000) {
          logger.warn('Page load time exceeds target', { pageLoadTime })
        }
      }, 0)
    })
  }

  // 监控用户交互性能 (FID - First Input Delay)
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // 记录长任务
          if (entry.duration > 50) {
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // 某些浏览器可能不支持longtask
      logger.debug('PerformanceObserver not fully supported', error)
    }
  }

  logger.debug('Performance monitoring set up')
}

/**
 * 更新用户上下文（登录后调用）
 * @param {Object} userInfo - 用户信息
 */
export function updateUserContext(userInfo) {
  const context = {
    userId: userInfo.userId || userInfo.id,
    username: userInfo.username
  }

  logger.setContext(context)
  logger.info('User context updated', { userId: context.userId })
}

/**
 * 清除用户上下文（登出后调用）
 */
export function clearUserContext() {
  logger.setContext({
    userId: 'anonymous',
    username: null
  })
  logger.info('User context cleared')
}

/**
 * 获取logger实例（用于外部访问）
 */
export function getLogger() {
  return logger
}

/**
 * 获取errorHandler实例（用于外部访问）
 */
export function getErrorHandler() {
  return errorHandler
}

export default {
  initializeInfrastructure,
  updateUserContext,
  clearUserContext,
  getLogger,
  getErrorHandler
}
