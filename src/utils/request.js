import axios from "axios";

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

// 请求拦截器
service.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 如果响应中包含错误信息，也需要提取出来
    const data = response.data;

    // 检查响应结构中是否包含错误信息
    if (data && data.error) {
      // 创建自定义错误对象
      const errorObj = new Error(data.error);
      errorObj.isApiError = true;
      errorObj.apiData = data;
      errorObj.status = response.status;
      return Promise.reject(errorObj);
    }

    return data;
  },
  (error) => {
    // 格式化错误信息
    let errorMsg = "服务器请求失败";
    let errorData = {};

    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      errorMsg = data.error || data.message || `请求错误 (${status})`;
      errorData = data;

      // 根据状态码定制错误信息
      switch (status) {
        case 400:
          errorMsg = data.error || "请求参数错误";
          break;
        case 401:
          errorMsg = "认证失败，请重新登录";
          // 清除用户信息并跳转到登录页
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("apiKey");

          // 使用window.location跳转到登录页，确保整个应用重新加载
          window.location.href = "/login";
          break;
        case 403:
          errorMsg = "您没有权限访问该资源";
          // 权限错误也需要重新登录
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("apiKey");

          window.location.href = "/login";
          break;
        case 404:
          errorMsg = "请求的资源不存在";
          break;
        case 500:
          errorMsg = "服务器内部错误";
          break;
        case 413:
          errorMsg = "上传图片超过了 20MB";
          break;
        default:
          errorMsg = data.error || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      errorMsg = "服务器无响应";
    } else if (error.message) {
      // 请求设置时发生错误
      if (error.message.includes("timeout")) {
        errorMsg = "请求超时，请稍后重试";
      } else {
        errorMsg = error.message;
      }
    }

    // 增强错误对象
    const enhancedError = new Error(errorMsg);
    enhancedError.isApiError = true;
    enhancedError.originalError = error;
    enhancedError.errorData = errorData;

    // 日志记录错误
    console.error("API请求错误:", errorMsg, error);

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
