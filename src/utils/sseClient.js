import logger from './logger'
import errorHandler from './errorHandler'

/**
 * SSE事件类型
 */
export const SSEEventType = {
  MESSAGE: 'message', // 常规消息
  STREAM_START: 'stream_start', // 流开始
  STREAM_DATA: 'stream_data', // 流数据
  STREAM_END: 'stream_end', // 流结束
  ERROR: 'error', // 错误
  DONE: 'done' // 完成
}

/**
 * SSE客户端类
 * 用于处理Server-Sent Events流式响应
 */
class SSEClient {
  constructor() {
    this.eventSource = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.reconnectDelay = 1000 // 1秒
    this.handlers = new Map()
    this.abortController = null
  }

  /**
   * 使用fetch API创建SSE连接
   * @param {string} url - SSE端点URL
   * @param {Object} options - 连接选项
   */
  async connect(url, options = {}) {
    try {
      logger.info('SSE: Attempting to connect', { url })

      // 创建新的AbortController用于取消请求
      this.abortController = new AbortController()

      // 从localStorage获取API密钥
      const apiKey = localStorage.getItem('apiKey')

      // 发起fetch请求
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: this.abortController.signal
      })

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`)
      }

      this.isConnected = true
      this.reconnectAttempts = 0
      logger.info('SSE: Connected successfully')

      // 读取流数据
      await this.readStream(response)
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.info('SSE: Connection aborted by user')
        this.emit(SSEEventType.DONE, { reason: 'aborted' })
        return
      }

      logger.error('SSE: Connection error', error)
      const standardError = errorHandler.handle(error, { url, options })
      this.emit(SSEEventType.ERROR, standardError)

      // 尝试重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        logger.info(`SSE: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        setTimeout(() => {
          this.connect(url, options)
        }, this.reconnectDelay * this.reconnectAttempts)
      } else {
        logger.error('SSE: Max reconnect attempts reached')
        this.emit(SSEEventType.ERROR, { message: '连接失败，已达到最大重试次数' })
      }
    }
  }

  /**
   * 读取流数据
   * @param {Response} response - fetch响应对象
   */
  async readStream(response) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          logger.info('SSE: Stream ended')
          this.isConnected = false
          this.emit(SSEEventType.DONE, { reason: 'completed' })
          break
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })

        // 按行分割
        const lines = buffer.split('\n')

        // 保留最后一个不完整的行
        buffer = lines.pop() || ''

        // 处理每一行
        for (const line of lines) {
          this.processLine(line)
        }
      }
    } catch (error) {
      logger.error('SSE: Stream read error', error)
      this.isConnected = false
      const standardError = errorHandler.handle(error)
      this.emit(SSEEventType.ERROR, standardError)
    }
  }

  /**
   * 处理单行数据
   * @param {string} line - 数据行
   */
  processLine(line) {
    // 跳过空行
    if (!line.trim()) {
      return
    }

    // 跳过注释行
    if (line.startsWith(':')) {
      return
    }

    // 解析SSE格式: "data: {...}"
    if (line.startsWith('data: ')) {
      const dataStr = line.substring(6).trim()

      // 检查是否是[DONE]标记
      if (dataStr === '[DONE]') {
        logger.info('SSE: Received [DONE] marker')
        this.isConnected = false
        this.emit(SSEEventType.DONE, { reason: 'completed' })
        return
      }

      try {
        // 尝试解析JSON数据
        const data = JSON.parse(dataStr)
        this.handleData(data)
      } catch {
        // 如果不是JSON，直接作为文本处理
        logger.debug('SSE: Received plain text data', { data: dataStr })
        this.emit(SSEEventType.MESSAGE, { content: dataStr })
      }
    } else if (line.startsWith('event: ')) {
      // 处理自定义事件类型
      const eventType = line.substring(7).trim()
      logger.debug('SSE: Received custom event', { eventType })
    }
  }

  /**
   * 处理解析后的数据
   * @param {Object} data - 数据对象
   */
  handleData(data) {
    // 根据数据类型触发不同事件
    if (data.type) {
      switch (data.type) {
        case 'start':
          this.emit(SSEEventType.STREAM_START, data)
          break
        case 'data':
        case 'content':
          this.emit(SSEEventType.STREAM_DATA, data)
          break
        case 'end':
          this.emit(SSEEventType.STREAM_END, data)
          break
        case 'error':
          this.emit(SSEEventType.ERROR, data)
          break
        default:
          this.emit(SSEEventType.MESSAGE, data)
      }
    } else {
      // 没有type字段，默认作为消息处理
      this.emit(SSEEventType.MESSAGE, data)
    }
  }

  /**
   * 注册事件处理器
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 处理函数
   */
  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType).push(handler)
  }

  /**
   * 移除事件处理器
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 处理函数
   */
  off(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      return
    }
    const handlers = this.handlers.get(eventType)
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  /**
   * 触发事件
   * @param {string} eventType - 事件类型
   * @param {any} data - 事件数据
   */
  emit(eventType, data) {
    if (!this.handlers.has(eventType)) {
      return
    }
    const handlers = this.handlers.get(eventType)
    for (const handler of handlers) {
      try {
        handler(data)
      } catch (error) {
        logger.error('SSE: Event handler error', { eventType, error })
      }
    }
  }

  /**
   * 关闭连接
   */
  close() {
    logger.info('SSE: Closing connection')

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.isConnected = false
    this.handlers.clear()
  }

  /**
   * 检查连接状态
   * @returns {boolean} 是否已连接
   */
  isActive() {
    return this.isConnected
  }
}

export default SSEClient
export { SSEClient }
