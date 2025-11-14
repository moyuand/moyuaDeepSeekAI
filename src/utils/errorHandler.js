import { ERROR_CODES, getErrorMessage, shouldReLogin } from '@/constants/errorCodes'

/**
 * 统一错误处理类
 * 实现3层错误处理架构：HTTP错误、网络错误、通用错误
 */
class ErrorHandler {
  constructor() {
    this.logger = null // 将在logger创建后注入
  }

  /**
   * 设置日志记录器
   * @param {Logger} logger - 日志记录器实例
   */
  setLogger(logger) {
    this.logger = logger
  }

  /**
   * 处理错误的主入口
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文信息
   * @returns {Object} 标准化的错误对象
   */
  handle(error, context = {}) {
    // 记录错误日志
    this.logError(error, context)

    // 根据错误类型进行分类处理
    if (error.isApiError) {
      return this.handleApiError(error, context)
    }

    if (error.response) {
      return this.handleHttpError(error, context)
    }

    if (error.request) {
      return this.handleNetworkError(error, context)
    }

    return this.handleGenericError(error, context)
  }

  /**
   * 处理API错误（后端返回的业务错误）
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   * @returns {Object} 标准化错误
   */
  handleApiError(error, context) {
    const { code, message, status } = error

    // 如果是需要重新登录的错误
    if (shouldReLogin(code)) {
      this.handleUnauthorized()
      return this.createStandardError({
        type: 'AUTH_ERROR',
        code,
        message: message || getErrorMessage(code),
        status,
        context,
        shouldRedirect: true
      })
    }

    return this.createStandardError({
      type: 'API_ERROR',
      code,
      message: message || getErrorMessage(code),
      status,
      context
    })
  }

  /**
   * 处理HTTP错误（状态码错误）
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   * @returns {Object} 标准化错误
   */
  handleHttpError(error, context) {
    const { status, data } = error.response
    let message = '请求失败'
    let code = null

    switch (status) {
      case 400:
        message = data?.message || '请求参数错误'
        code = data?.code || ERROR_CODES.INVALID_PARAMETER
        break
      case 401:
        message = '认证失败，请重新登录'
        code = ERROR_CODES.UNAUTHORIZED
        this.handleUnauthorized()
        break
      case 403:
        message = '权限不足，无法访问'
        code = ERROR_CODES.FORBIDDEN
        this.handleForbidden()
        break
      case 404:
        message = '请求的资源不存在'
        code = ERROR_CODES.RESOURCE_NOT_FOUND
        break
      case 413:
        message = '上传文件过大'
        code = ERROR_CODES.INVALID_PARAMETER
        break
      case 500:
        message = '服务器内部错误'
        code = ERROR_CODES.INTERNAL_ERROR
        break
      case 503:
        message = '服务暂时不可用'
        code = ERROR_CODES.INTERNAL_ERROR
        break
      default:
        message = data?.message || `请求失败 (${status})`
        code = data?.code || ERROR_CODES.INTERNAL_ERROR
    }

    return this.createStandardError({
      type: 'HTTP_ERROR',
      code,
      message,
      status,
      context,
      shouldRedirect: status === 401 || status === 403
    })
  }

  /**
   * 处理网络错误（无响应）
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   * @returns {Object} 标准化错误
   */
  handleNetworkError(error, context) {
    let message = '网络连接失败'

    if (error.message?.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else if (error.message?.includes('Network Error')) {
      message = '网络连接失败，请检查网络'
    }

    return this.createStandardError({
      type: 'NETWORK_ERROR',
      code: ERROR_CODES.NETWORK_ERROR,
      message,
      context
    })
  }

  /**
   * 处理通用错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   * @returns {Object} 标准化错误
   */
  handleGenericError(error, context) {
    return this.createStandardError({
      type: 'GENERIC_ERROR',
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || '操作失败',
      context
    })
  }

  /**
   * 处理未授权错误（401）
   */
  handleUnauthorized() {
    // 清除认证信息
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('apiKey')

    // 延迟跳转，给用户看到错误提示的时间
    setTimeout(() => {
      window.location.href = '/login'
    }, 1000)
  }

  /**
   * 处理权限不足错误（403）
   */
  handleForbidden() {
    // 同样清除认证信息，因为可能是token失效
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('apiKey')

    setTimeout(() => {
      window.location.href = '/login'
    }, 1000)
  }

  /**
   * 创建标准化错误对象
   * @param {Object} options - 错误选项
   * @returns {Object} 标准化错误对象
   */
  createStandardError({
    type,
    code,
    message,
    status = null,
    context = {},
    shouldRedirect = false
  }) {
    return {
      type,
      code,
      message,
      status,
      context,
      shouldRedirect,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 记录错误日志
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  logError(error, context) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }

    // 如果有logger实例，使用logger记录
    if (this.logger) {
      this.logger.error('Error occurred:', errorInfo)
    } else {
      // 否则直接使用console
      console.error('Error occurred:', errorInfo)
    }
  }

  /**
   * 显示用户友好的错误提示
   * @param {Object} standardError - 标准化错误对象
   * @param {Function} messageApi - Naive UI的message API
   */
  showUserMessage(standardError, messageApi) {
    if (messageApi && typeof messageApi.error === 'function') {
      messageApi.error(standardError.message)
    }
  }
}

// 创建单例实例
const errorHandler = new ErrorHandler()

export default errorHandler
export { ErrorHandler }
