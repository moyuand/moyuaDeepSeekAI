// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import naive from 'naive-ui'

// 导入highlight.js的样式，用于代码高亮
import 'highlight.js/styles/github.css'

import './index.css'

// 初始化基础设施（日志、错误处理等）
import { initializeInfrastructure } from './utils/infrastructure'

// 在创建应用之前初始化基础设施
initializeInfrastructure()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app')
