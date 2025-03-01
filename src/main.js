// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import naive from 'naive-ui'

// 导入highlight.js的样式，用于代码高亮
import 'highlight.js/styles/github.css'

import './index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app')
