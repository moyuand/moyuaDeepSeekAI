/**
 * 统一日志系统
 * 支持5个级别：debug、info、warn、error、fatal
 * 功能：控制台输出、内存缓存、服务器上报（可选）
 */

// 日志级别枚举
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
}

// 日志级别名称映射
const LogLevelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
}

// 日志级别颜色映射（用于控制台输出）
const LogLevelColors = {
  [LogLevel.DEBUG]: '#808080', // 灰色
  [LogLevel.INFO]: '#1890ff', // 蓝色
  [LogLevel.WARN]: '#faad14', // 橙色
  [LogLevel.ERROR]: '#ff4d4f', // 红色
  [LogLevel.FATAL]: '#a8071a' // 深红色
}

/**
 * Logger类
 */
class Logger {
  constructor(options = {}) {
    // 当前日志级别（低于此级别的日志不会输出）
    this.level = options.level ?? (import.meta.env.MODE === 'production' ? LogLevel.INFO : LogLevel.DEBUG)

    // 是否启用控制台输出
    this.enableConsole = options.enableConsole ?? true

    // 是否启用内存缓存
    this.enableCache = options.enableCache ?? true

    // 内存缓存大小限制（条数）
    this.cacheLimit = options.cacheLimit ?? 1000

    // 是否启用服务器上报
    this.enableServerReport = options.enableServerReport ?? false

    // 服务器上报的URL
    this.serverReportUrl = options.serverReportUrl ?? '/api/logs'

    // 内存日志缓存
    this.logs = []

    // 应用上下文信息
    this.context = {
      appName: 'moyuDeepSeekAI',
      appVersion: '1.0.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
    }
  }

  /**
   * 设置日志级别
   * @param {number} level - 日志级别
   */
  setLevel(level) {
    this.level = level
  }

  /**
   * 设置应用上下文
   * @param {Object} context - 上下文信息
   */
  setContext(context) {
    this.context = { ...this.context, ...context }
  }

  /**
   * Debug日志
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  debug(message, data = null) {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Info日志
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  info(message, data = null) {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Warning日志
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  warn(message, data = null) {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Error日志
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  error(message, data = null) {
    this.log(LogLevel.ERROR, message, data)
  }

  /**
   * Fatal日志（致命错误）
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  fatal(message, data = null) {
    this.log(LogLevel.FATAL, message, data)
  }

  /**
   * 核心日志方法
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   */
  log(level, message, data = null) {
    // 如果日志级别低于当前设置，不输出
    if (level < this.level) {
      return
    }

    // 创建日志对象
    const logEntry = this.createLogEntry(level, message, data)

    // 控制台输出
    if (this.enableConsole) {
      this.outputToConsole(logEntry)
    }

    // 添加到内存缓存
    if (this.enableCache) {
      this.addToCache(logEntry)
    }

    // 上报到服务器（仅ERROR和FATAL级别）
    if (this.enableServerReport && level >= LogLevel.ERROR) {
      this.reportToServer(logEntry)
    }
  }

  /**
   * 创建日志条目
   * @param {number} level - 日志级别
   * @param {string} message - 日志消息
   * @param {any} data - 附加数据
   * @returns {Object} 日志条目
   */
  createLogEntry(level, message, data) {
    return {
      level: LogLevelNames[level],
      levelNum: level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context: this.context,
      // 获取调用栈信息（用于定位）
      stack: this.getCallerInfo()
    }
  }

  /**
   * 获取调用者信息
   * @returns {string} 调用栈信息
   */
  getCallerInfo() {
    try {
      const err = new Error()
      const stack = err.stack?.split('\n')
      // 跳过前3行（Error、getCallerInfo、log）
      return stack?.[4]?.trim() || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 输出到控制台
   * @param {Object} logEntry - 日志条目
   */
  outputToConsole(logEntry) {
    const { level, levelNum, message, data, timestamp } = logEntry
    const color = LogLevelColors[levelNum]
    const timeStr = new Date(timestamp).toLocaleTimeString()

    // 根据级别选择console方法
    const consoleMethod = this.getConsoleMethod(levelNum)

    // 格式化输出
    if (data) {
      consoleMethod(
        `%c[${level}] %c${timeStr} %c${message}`,
        `color: ${color}; font-weight: bold`,
        'color: #999',
        'color: inherit',
        data
      )
    } else {
      consoleMethod(
        `%c[${level}] %c${timeStr} %c${message}`,
        `color: ${color}; font-weight: bold`,
        'color: #999',
        'color: inherit'
      )
    }
  }

  /**
   * 获取对应的console方法
   * @param {number} level - 日志级别
   * @returns {Function} console方法
   */
  getConsoleMethod(level) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console)
      case LogLevel.INFO:
        return console.info.bind(console)
      case LogLevel.WARN:
        return console.warn.bind(console)
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error.bind(console)
      default:
        return console.log.bind(console)
    }
  }

  /**
   * 添加到内存缓存
   * @param {Object} logEntry - 日志条目
   */
  addToCache(logEntry) {
    this.logs.push(logEntry)

    // 如果超过缓存限制，删除最旧的日志
    if (this.logs.length > this.cacheLimit) {
      this.logs.shift()
    }
  }

  /**
   * 上报到服务器
   * @param {Object} logEntry - 日志条目
   */
  async reportToServer(logEntry) {
    try {
      // 使用fetch发送日志
      await fetch(this.serverReportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: [logEntry]
        })
      })
    } catch (error) {
      // 上报失败时只在控制台输出，避免递归
      console.error('Failed to report log to server:', error)
    }
  }

  /**
   * 获取缓存的日志
   * @param {Object} filters - 过滤条件
   * @returns {Array} 日志列表
   */
  getLogs(filters = {}) {
    let result = [...this.logs]

    // 按级别过滤
    if (filters.level !== undefined) {
      result = result.filter((log) => log.levelNum >= filters.level)
    }

    // 按时间范围过滤
    if (filters.startTime) {
      result = result.filter((log) => new Date(log.timestamp) >= new Date(filters.startTime))
    }
    if (filters.endTime) {
      result = result.filter((log) => new Date(log.timestamp) <= new Date(filters.endTime))
    }

    // 按消息内容过滤
    if (filters.message) {
      result = result.filter((log) => log.message.includes(filters.message))
    }

    return result
  }

  /**
   * 清除缓存的日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 导出日志（用于调试）
   * @returns {string} JSON格式的日志
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }
}

// 创建默认logger实例
const logger = new Logger()

export default logger
export { Logger }
