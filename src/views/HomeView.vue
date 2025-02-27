<template>
  <n-message-provider>
    <!-- 整个页面使用 flex-column 布局 -->
    <div class="chat-container">
      <!-- 聊天记录区域 -->
      <div class="messages">
        <div
          v-for="(msg, index) in conversationHistory"
          :key="index"
          class="message-row"
          :class="msg.role === 'user' ? 'user' : 'assistant'"
        >
          <div class="message-bubble">
            <!-- 用户消息 -->
            <template v-if="msg.role === 'user'">
              <div v-html="marked(msg.content)"></div>
            </template>
            <!-- AI 消息 -->
            <template v-else>
              <div v-if="msg.reasoning">
                <em>思考过程：</em>
                <div v-html="marked(msg.reasoning)"></div>
              </div>
              <div v-if="msg.content">
                <em>结果：</em>
                <div v-html="marked(msg.content)"></div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 输入区域固定在底部 -->
      <div class="input-area">
        <n-select
          v-model:value="selectedModel"
          :options="options"
          class="pb-2"
          placeholder="请选择模型"
          @update-value="handleUpdateModel"
        />
        <n-input
          v-model:value="content"
          type="textarea"
          placeholder="请输入对话内容"
        />
        <div class="btn-group">
          <!-- <n-dropdown :options="uploadType" trigger="click" @select="selectType">
          <n-button circle>
            <n-icon size="24">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                  d="M368.5 240H272v-96.5c0-8.8-7.2-16-16-16s-16 7.2-16 16V240h-96.5c-8.8 0-16 7.2-16 16 0 4.4 1.8 8.4 4.7 11.3 2.9 2.9 6.9 4.7 11.3 4.7H240v96.5c0 4.4 1.8 8.4 4.7 11.3 2.9 2.9 6.9 4.7 11.3 4.7 8.8 0 16-7.2 16-16V272h96.5c8.8 0 16-7.2 16-16s-7.2-16-16-16z"
                />
              </svg>
            </n-icon>
          </n-button>
        </n-dropdown> -->

          <n-upload
            action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
            :headers="{
              'naive-info': 'hello!',
            }"
            :data="{
              'naive-data': 'cool! naive!',
            }"
            @before-upload="beforeUpload"
          >
            <n-button>上传文件</n-button>
          </n-upload>

          <n-button type="info" @click="sendMessage" secondary>
            <n-icon size="22">
              <Send24Filled />
            </n-icon>
          </n-button>
          <n-button @click="clearConversation">清空对话</n-button>
        </div>
      </div>
    </div>
  </n-message-provider>
</template>

<script setup>
import { ref } from "vue";
import { marked } from "marked";
import { useMessage } from "naive-ui";
import { Send24Filled } from "@vicons/fluent";

// 1) 用户输入的文本
const content = ref("");

// 2) 多轮对话记录
//    每个元素示例：
//    - 用户消息：{ role: 'user', content: '...' }
//    - AI 消息：{ role: 'assistant', reasoning: '...', content: '...' }
const conversationHistory = ref([]);

// 3) 当前对话的 taskId
const currentTaskId = ref(null);
const message = useMessage();

const options = ref([
  {
    label: "DeepSeek R1",
    value: "deepseek-r1",
  },
  {
    label: "通义千问",
    value: "qwen-omni-turbo",
  },
]);

const uploadType = ref([
  {
    label: "上传图片",
    key: "image",
  },
  {
    label: "上传文件",
    key: "file",
  },
  {
    label: "上传视频",
    key: "video",
  },
  {
    label: "上传音频",
    key: "audio",
  },
]);

const selectedModel = ref("deepseek-r1");

// 选择上传类型
const selectType = (value) => {
  console.log("选择了上传类型：", value);
};

const beforeUpload = async (data) => {
  if (
    data.file.file?.type !== "image/jpeg" &&
    data.file.file?.type !== "image/png" &&
    data.file.file?.type !== "image/jpg"
  ) {
    console.error("只能上传 jpg、png、jpeg 格式的图片");
    message.error("只能上传 jpg、png、jpeg 格式的图片");
    return false;
  }
  return true;
};

const handleUpdateModel = async (value) => {
  console.log("选择了模型：", value);
  const res = await fetch("http://192.168.168.40:3000/updateModel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: value }),
  });
  content.value = "";
  conversationHistory.value = [];
  currentTaskId.value = null;
  const result = await res.json();
  console.log("更新模型结果：", result);
};

/**
 * 发送消息（首次 or 后续）
 */
const sendMessage = async () => {
  // 若输入为空，则不处理
  if (!content.value.trim()) return;

  let taskId;

  // 先将用户消息 push 到对话记录
  conversationHistory.value.push({
    role: "user",
    content: content.value,
  });

  // 判断是首次还是后续
  if (!currentTaskId.value) {
    // 第一次：POST /start
    const response = await fetch("http://192.168.168.40:3000/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.value }),
    });
    const result = await response.json();
    taskId = result.taskId;
    currentTaskId.value = taskId;
  } else {
    // 后续：POST /continue
    taskId = currentTaskId.value;
    await fetch("http://192.168.168.40:3000/continue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, content: content.value }),
    });
  }

  // 清空输入框
  content.value = "";

  // 建立 SSE 连接
  doSSE(taskId);
};

/**
 * 建立 SSE，实时接收 AI 消息
 */
const doSSE = (taskId) => {
  const evtSource = new EventSource(
    `http://192.168.168.40:3000/events?taskId=${taskId}`
  );

  // 在对话历史中新建一条空的 AI 消息，准备拼接思考过程和结果
  conversationHistory.value.push({
    role: "assistant",
    reasoning: "",
    content: "",
  });
  const currentIndex = conversationHistory.value.length - 1;

  evtSource.onmessage = (e) => {
    if (e.data === "[DONE]") {
      evtSource.close();
    } else if (e.data.startsWith("[reasoning]")) {
      const chunk = e.data.replace("[reasoning]", "");
      conversationHistory.value[currentIndex].reasoning += chunk;
    } else if (e.data.startsWith("[result]")) {
      const chunk = e.data.replace("[result]", "");
      conversationHistory.value[currentIndex].content += chunk;
    } else {
      console.log("Other SSE data:", e.data);
    }
  };

  evtSource.onerror = (err) => {
    console.error("EventSource 错误:", err);
    evtSource.close();
  };
};

/**
 * 清空对话
 */
const clearConversation = async () => {
  content.value = "";
  conversationHistory.value = [];
  currentTaskId.value = null;
  const res = await fetch("http://192.168.168.40:3000/clear", {
    method: "get",
  });
  const result = await res.json();
  console.log("清空对话结果：", result);
};
</script>

<style scoped>
/* 整个页面充满视口，高度 100vh */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 聊天记录区域自动占满上方剩余空间，并支持滚动 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: #fff;
}

/* 输入区域始终显示在底部 */
.input-area {
  padding: 1rem;
  background-color: #fafafa;
  border-top: 1px solid #eee;
}

/* 按钮组样式 */
.btn-group {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

/* 每条消息的行 */
.message-row {
  display: flex;
  margin-bottom: 1rem;
}

/* 用户消息右对齐，AI 消息左对齐 */
.message-row.user {
  justify-content: flex-end;
}
.message-row.assistant {
  justify-content: flex-start;
}

/* 消息气泡样式 */
.message-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* 用户气泡（右侧，绿色背景） */
.user .message-bubble {
  background-color: #dcf8c6;
  color: #333;
}

/* AI 气泡（左侧，灰色背景） */
.assistant .message-bubble {
  background-color: #ececec;
  color: #333;
}

/* 响应式：手机端可以根据需要微调 */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>
