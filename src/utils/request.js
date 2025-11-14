import axios from "axios";
import { getErrorMessage, shouldReLogin } from "@/constants/errorCodes";
import logger from "./logger";
import errorHandler from "./errorHandler";

// 创建axios实例
const service = axios.create({
  baseURL: "/api",
  timeout: 15000,
  withCredentials: true, // 允许跨域携带cookie
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});

// 生成请求ID用于追踪
let requestId = 0;
function generateRequestId() {
  return `req_${Date.now()}_${++requestId}`;
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 生成请求ID
    const reqId = generateRequestId();
    config.headers['X-Request-ID'] = reqId;

    // 记录请求日志
    logger.debug('API Request', {
      requestId: reqId,
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data
    });

    // 在这里可以添加请求头等配置
    const apiKey = localStorage.getItem("apiKey");

    config.headers = {
      ...config.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, Accept, Authorization, X-Request-With",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    };
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const data = response.data;
    const requestId = response.config.headers['X-Request-ID'];

    // 记录成功响应
    logger.debug('API Response', {
      requestId,
      status: response.status,
      url: response.config.url
    });

    // 新格式: { success, code, message, data }
    if (data && typeof data.success === 'boolean') {
      // 如果请求失败 (success === false)
      if (!data.success) {
        const errorMsg = data.message || getErrorMessage(data.code);
        const errorObj = new Error(errorMsg);
        errorObj.isApiError = true;
        errorObj.code = data.code;
        errorObj.apiData = data;
        errorObj.status = response.status;

        // 记录API错误
        logger.warn('API Error', {
          requestId,
          code: data.code,
          message: errorMsg,
          url: response.config.url
        });

        // 如果是需要重新登录的错误
        if (shouldReLogin(data.code)) {
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("apiKey");
          window.location.href = "/login";
        }

        return Promise.reject(errorObj);
      }

      // 成功时返回 data 字段
      return data.data || data;
    }

    // 兼容旧格式或其他响应格式
    if (data && data.error) {
      const errorObj = new Error(data.error);
      errorObj.isApiError = true;
      errorObj.apiData = data;
      errorObj.status = response.status;

      logger.warn('API Error (legacy format)', {
        requestId,
        error: data.error,
        url: response.config.url
      });

      return Promise.reject(errorObj);
    }

    return data;
  },
  (error) => {
    const requestId = error.config?.headers?.['X-Request-ID'];

    // 使用errorHandler统一处理错误
    const standardError = errorHandler.handle(error, {
      requestId,
      url: error.config?.url,
      method: error.config?.method
    });

    // 记录详细错误信息
    logger.error('API Request Failed', {
      requestId,
      url: error.config?.url,
      method: error.config?.method,
      errorType: standardError.type,
      errorCode: standardError.code,
      errorMessage: standardError.message,
      status: standardError.status
    });

    // 创建增强的错误对象，保持向后兼容
    const enhancedError = new Error(standardError.message);
    enhancedError.isApiError = true;
    enhancedError.originalError = error;
    enhancedError.standardError = standardError;
    enhancedError.code = standardError.code;
    enhancedError.status = standardError.status;

    return Promise.reject(enhancedError);
  }
);

// 封装GET请求
export const get = (url, params) => {
  return service.get(url, { params });
};

// 封装POST请求
export const post = (url, data) => {
  return service.post(url, data);
};

// 封装PUT请求
export const put = (url, data) => {
  return service.put(url, data);
};

// 封装PATCH请求
export const patch = (url, data) => {
  return service.patch(url, data);
};

// 封装DELETE请求
export const del = (url, params) => {
  return service.delete(url, { params });
};

// 封装上传文件的请求
export const upload = (url, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return service.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export default service;
