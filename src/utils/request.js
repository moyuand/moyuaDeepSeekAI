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
    config.headers = {
      ...config.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, Accept, Authorization, X-Request-With",
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
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
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
