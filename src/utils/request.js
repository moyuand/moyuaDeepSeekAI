import axios from 'axios';

// 创建axios实例
const service = axios.create({
  baseURL: 'http://192.168.168.198:3000',
  timeout: 15000,
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以添加请求头等配置
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
  formData.append('file', file);
  return service.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default service;