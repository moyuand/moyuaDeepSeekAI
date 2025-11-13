/**
 * 错误码常量定义
 * 与后端保持一致
 */

export const ERROR_CODES = {
  // 成功
  SUCCESS: 0,

  // 用户认证 (1000-1999)
  INVALID_CREDENTIALS: 1001,      // 用户名或密码错误
  ACCOUNT_DISABLED: 1002,         // 账户已被禁用
  MISSING_CREDENTIALS: 1003,      // 缺少登录凭证
  INVALID_API_KEY: 1004,          // API密钥无效
  UNAUTHORIZED: 1005,             // 未授权访问
  FORBIDDEN: 1006,                // 权限不足

  // 数据验证 (2000-2999)
  MISSING_FIELDS: 2001,           // 缺少必填字段
  INVALID_EMAIL: 2002,            // 邮箱格式不正确
  WEAK_PASSWORD: 2003,            // 密码强度不足
  USERNAME_EXISTS: 2004,          // 用户名已存在
  INVALID_PARAMETER: 2005,        // 参数格式错误

  // 业务逻辑 (3000-3999)
  USER_NOT_FOUND: 3001,           // 用户不存在
  RESOURCE_NOT_FOUND: 3002,       // 资源不存在
  OPERATION_FAILED: 3003,         // 操作失败
  DUPLICATE_OPERATION: 3004,      // 重复操作

  // 系统错误 (4000-4999)
  INTERNAL_ERROR: 4001,           // 服务器内部错误
  DATABASE_ERROR: 4002,           // 数据库错误
  NETWORK_ERROR: 4003,            // 网络错误

  // 第三方服务 (5000-5999)
  AI_API_ERROR: 5001,             // AI API 错误
  REDIS_ERROR: 5002,              // Redis 错误
};

/**
 * 错误码到用户友好消息的映射
 */
export const ERROR_MESSAGES = {
  // 用户认证
  [ERROR_CODES.INVALID_CREDENTIALS]: '用户名或密码错误,请重试',
  [ERROR_CODES.ACCOUNT_DISABLED]: '账户已被禁用,请联系管理员',
  [ERROR_CODES.MISSING_CREDENTIALS]: '请输入用户名和密码',
  [ERROR_CODES.INVALID_API_KEY]: 'API密钥无效,请重新登录',
  [ERROR_CODES.UNAUTHORIZED]: '未授权访问,请先登录',
  [ERROR_CODES.FORBIDDEN]: '权限不足,无法执行此操作',

  // 数据验证
  [ERROR_CODES.MISSING_FIELDS]: '请填写所有必填字段',
  [ERROR_CODES.INVALID_EMAIL]: '邮箱格式不正确',
  [ERROR_CODES.WEAK_PASSWORD]: '密码长度至少为6位',
  [ERROR_CODES.USERNAME_EXISTS]: '用户名已被使用,请更换',
  [ERROR_CODES.INVALID_PARAMETER]: '参数格式不正确',

  // 业务逻辑
  [ERROR_CODES.USER_NOT_FOUND]: '用户不存在',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: '请求的资源不存在',
  [ERROR_CODES.OPERATION_FAILED]: '操作失败,请重试',
  [ERROR_CODES.DUPLICATE_OPERATION]: '请勿重复提交',

  // 系统错误
  [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误,请稍后重试',
  [ERROR_CODES.DATABASE_ERROR]: '数据库错误,请稍后重试',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败,请检查网络',

  // 第三方服务
  [ERROR_CODES.AI_API_ERROR]: 'AI服务暂时不可用,请稍后重试',
  [ERROR_CODES.REDIS_ERROR]: '缓存服务错误,请稍后重试',
};

/**
 * 获取错误消息
 * @param {number} code - 错误码
 * @param {string} defaultMessage - 默认消息
 * @returns {string} 错误消息
 */
export function getErrorMessage(code, defaultMessage = '操作失败') {
  return ERROR_MESSAGES[code] || defaultMessage;
}

/**
 * 判断是否为认证相关错误
 * @param {number} code - 错误码
 * @returns {boolean}
 */
export function isAuthError(code) {
  return code >= 1000 && code < 2000;
}

/**
 * 判断是否需要重新登录
 * @param {number} code - 错误码
 * @returns {boolean}
 */
export function shouldReLogin(code) {
  return [
    ERROR_CODES.INVALID_API_KEY,
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.ACCOUNT_DISABLED
  ].includes(code);
}
