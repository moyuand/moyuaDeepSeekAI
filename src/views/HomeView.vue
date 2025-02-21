<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
// import TheWelcome from '../components/TheWelcome.vue'
const content = ref('')
const data = ref('')

const reasoningData = ref('')
const resultData = ref('')

const show = ref(true)

// 如果想用 Markdown 渲染，可用 computed
const compiledReasoning = computed(() => marked(reasoningData.value))
const compiledResult = computed(() => marked(resultData.value))

const getData = async () => {
  // 先通过 POST 请求发送参数到 /start 接口
  const response = await fetch('http://192.168.168.40:3000/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.value }),
  })
  const result = await response.json()
  const taskId = result.taskId
  console.log('收到 taskId:', taskId)

  // 根据 taskId 建立 SSE 连接到 /events 接口
  const evtSource = new EventSource(`http://192.168.168.40:3000/events?taskId=${taskId}`)

  evtSource.onmessage = function (e) {
    if (e.data === '[DONE]') {
      // 任务结束，关闭 SSE
      evtSource.close()
    } else if (e.data.startsWith('[reasoning]')) {
      // 收到思考过程
      const chunk = e.data.replace('[reasoning]', '')
      // 累加到 reasoningData
      reasoningData.value += chunk
    } else if (e.data.startsWith('[result]')) {
      // 收到正式回答
      const chunk = e.data.replace('[result]', '')
      // 累加到 resultData
      resultData.value += chunk
    } else {
      // 如果有其他情况，可视需求处理
      console.log('Other SSE data:', e.data)
    }
  }

  evtSource.onerror = function (err) {
    console.error('EventSource 错误:', err)
    evtSource.close()
  }
}

const toClear = () => {
  content.value = ''
  reasoningData.value = ''
  resultData.value = ''
}

const railStyle = ({ focused, checked }) => {
  const style = {}
  if (focused) {
    console.log('111')
    style.className = 'bg-sky-200'
  }
  if (checked) {
    console.log('222')
    style.className = 'bg-white'
  }
  return style
}
</script>

<template>
  <n-input v-model:value="content" type="textarea" placeholder="基本的 Input" />
  <div class="space-x-4 m-2">
    <n-button type="info" @click="getData">提交</n-button>
    <n-button @click="toClear">清空</n-button>
  </div>

  <div>
    思考过程
    <n-switch v-model:value="show" size="small" :rail-style="railStyle">
      <template #checked> 展开 </template>
      <template #unchecked> 折叠 </template>
    </n-switch>
  </div>

  <n-collapse-transition :show="show">
    <div class="text-gray-300" v-html="compiledReasoning"></div>
  </n-collapse-transition>

  <hr />
  <h3>最终回答</h3>
  <div v-html="compiledResult"></div>
</template>
