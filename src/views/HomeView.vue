<template>
  <n-message-provider>
    <!-- 整个页面使用 flex-column 布局 -->
    <div class="chat-container">
      <n-page-header title="和 AI 的聊天小助手" class="p-4">
        <template #avatar>
          <n-avatar class="text-blue-500 bg-blue-100" round>Moyu</n-avatar>
        </template>
        <template #extra>
          <n-space>
            <n-select
              v-model:value="selectedModel"
              :options="options"
              placeholder="请选择模型"
              @update-value="handleUpdateModel"
            />
          </n-space>
        </template>
      </n-page-header>
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
        <n-input
          v-model:value="content"
          type="textarea"
          placeholder="请输入对话内容"
          @keydown.enter="sendMessage"
        />
        <div class="btn-group">
          <n-upload
            :custom-request="customRequest"
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

          <n-button
            type="info"
            @click="isGenerating ? stopGeneration() : sendMessage()"
            secondary
          >
            <n-icon size="22">
              <template v-if="isGenerating">
                <Stop24Filled />
              </template>
              <template v-else>
                <Send24Filled />
              </template>
            </n-icon>
            {{ isGenerating ? "停止" : "发送" }}
          </n-button>
          <n-button @click="clearConversation" type="info">清空对话</n-button>
        </div>
      </div>
    </div>
  </n-message-provider>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { marked } from "marked";
import { useMessage } from "naive-ui";
import { Send24Filled, Stop24Filled } from "@vicons/fluent";
import { get, post, upload } from "@/utils/request";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

// 配置marked使用highlight.js进行代码高亮
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-",
  gfm: true,
  breaks: true,
  pedantic: false,
  smartLists: true,
  smartypants: false,
  renderer: new marked.Renderer(),
  // 修改escape函数，只在非代码块的情况下转义HTML标签
  escape: function (html) {
    if (html.includes("<pre>") || html.includes("<code>")) {
      return html;
    }
    return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },
});
let userId = ref(null);
if (localStorage.getItem("userId") && localStorage.getItem("userId") !== null) {
  userId.value = localStorage.getItem("userId");
}

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

// 4) 是否正在生成回复
const isGenerating = ref(false);
// 5) 当前的EventSource实例
let currentEvtSource = null;

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

// const uploadType = ref([
//   {
//     label: "上传图片",
//     key: "image",
//   },
//   {
//     label: "上传文件",
//     key: "file",
//   },
//   {
//     label: "上传视频",
//     key: "video",
//   },
//   {
//     label: "上传音频",
//     key: "audio",
//   },
// ]);

const selectedModel = ref("deepseek-r1");

// 选择上传类型
// const selectType = (value) => {
//   console.log("选择了上传类型：", value);
// };

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
  const result = await post("/updateModel", { model: value });
  content.value = "";
  conversationHistory.value = [];
  currentTaskId.value = null;
  console.log("更新模型结果：", result);
};

// 上传文件
const customRequest = async (data) => {
  try {
    const result = await upload("/upload", data.file.file);
    console.log("上传文件结果：", result);
    if (result.code === 0) {
      message.success("上传成功");
      content.value = result.data.url;
    } else {
      message.error("上传失败");
    }
  } catch (error) {
    console.error("上传出错：", error);
    message.error("上传失败");
  }
};

/**
 * 停止生成
 */
const stopGeneration = () => {
  if (currentEvtSource) {
    currentEvtSource.close();
    currentEvtSource = null;
    isGenerating.value = false;

    // 在当前消息中添加提示
    const currentIndex = conversationHistory.value.length - 1;
    if (
      currentIndex >= 0 &&
      conversationHistory.value[currentIndex].role === "assistant"
    ) {
      conversationHistory.value[currentIndex].content +=
        "\n\n*[用户已停止生成]*";
    }

    message.info("已停止生成回复");
  }
};

/**
 * 发送消息（首次 or 后续）
 */
const sendMessage = async () => {
  // 若输入为空，则不处理
  if (!content.value.trim()) return;

  // 如果正在生成，则不处理
  if (isGenerating.value) return;

  let taskId;

  // 先将用户消息 push 到对话记录
  conversationHistory.value.push({
    role: "user",
    content: content.value,
  });

  // 滚动到最新消息
  scrollToBottom();

  // 判断是首次还是后续
  if (!currentTaskId.value) {
    // 第一次：POST /start
    const result = await post("/start", {
      content: content.value,
      userId: userId.value,
    });
    taskId = result.taskId;
    currentTaskId.value = taskId;
  } else {
    // 后续：POST /continue
    taskId = currentTaskId.value;
    await post("/continue", {
      taskId,
      content: content.value,
      userId: userId.value,
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
  // 设置生成状态为true
  isGenerating.value = true;

  // 创建并保存EventSource实例
  // 使用配置的API代理访问后端
  currentEvtSource = new EventSource(`/api/events?taskId=${taskId}`);

  // 在对话历史中新建一条空的 AI 消息，准备拼接思考过程和结果
  conversationHistory.value.push({
    role: "assistant",
    reasoning: "",
    content: "",
  });
  const currentIndex = conversationHistory.value.length - 1;

  currentEvtSource.onmessage = (e) => {
    if (e.data === "[DONE]") {
      currentEvtSource.close();
      currentEvtSource = null;
      isGenerating.value = false;
      scrollToBottom();
    } else if (e.data.startsWith("[reasoning]")) {
      const chunk = e.data.replace("[reasoning]", "");
      // 解码URL编码的内容
      const decodedChunk = decodeURIComponent(chunk);
      conversationHistory.value[currentIndex].reasoning += decodedChunk;
      scrollToBottom();
    } else if (e.data.startsWith("[result]")) {
      const chunk = e.data.replace("[result]", "");
      // 解码URL编码的内容
      const decodedChunk = decodeURIComponent(chunk);
      conversationHistory.value[currentIndex].content += decodedChunk;
      scrollToBottom();
    } else {
      console.log("Other SSE data:", e.data);
    }
  };

  currentEvtSource.onerror = (err) => {
    console.error("EventSource 错误:", err);
    currentEvtSource.close();
    currentEvtSource = null;
    isGenerating.value = false;
  };
};

// 添加用户滚动状态变量
const isUserScrolling = ref(false);
const lastScrollTop = ref(0);

/**
 * 滚动到最新消息
 */
const scrollToBottom = () => {
  // 如果用户正在手动滚动，则不自动滚动
  if (isUserScrolling.value) return;

  nextTick(() => {
    const messagesContainer = document.querySelector(".messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
};
async function getUserId() {
  const result = await get("/generateUserId");
  console.log("获取用户ID：", result.userId);
  userId.value = result.userId;
  localStorage.setItem("userId", userId.value);
}

// 监听滚动事件
onMounted(() => {
  // 如果localStorage中没有userId，则获取新的userId
  if (!userId.value) {
    getUserId();
  }

  localStorage.setItem("userId", userId.value);
  const messagesContainer = document.querySelector(".messages");
  if (messagesContainer) {
    messagesContainer.addEventListener("scroll", () => {
      // 检测是否是用户手动滚动
      const currentScrollTop = messagesContainer.scrollTop;
      const maxScrollTop =
        messagesContainer.scrollHeight - messagesContainer.clientHeight;

      // 更新用户滚动状态
      isUserScrolling.value = true;

      // 如果滚动到底部，重新启用自动滚动
      if (Math.abs(currentScrollTop - maxScrollTop) < 10) {
        isUserScrolling.value = false;
      }

      lastScrollTop.value = currentScrollTop;
    });
  }
});

/**
 * 清空对话
 */
const clearConversation = async () => {
  // 如果正在生成，先停止生成
  if (isGenerating.value) {
    stopGeneration();
  }

  content.value = "";
  conversationHistory.value = [];
  currentTaskId.value = null;
  const result = await get("/clear");
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
  max-width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  border: none; /* 确保没有边框 */
}

/* 用户气泡（右侧，绿色背景） */
.user .message-bubble {
  background-color: #dcf8c6;
  color: #333;
}

/* AI 气泡（左侧，灰色背景） */
.assistant .message-bubble {
  /* background-color: #ececec;
  color: #333; */
}

/* 代码块样式，类似ChatGPT */
:deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  font-family:
    "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  font-size: 16px;
  line-height: 1.45;
  border: 1px solid #e1e4e8;
  position: relative;
}

/* 代码行样式 */
:deep(code) {
  font-family:
    "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  font-size: 16px;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: rgba(27, 31, 35, 0.05);
  color: #24292e;
}

/* 代码块内的代码不需要额外背景色 */
:deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  white-space: pre;
  color: #24292e;
}

/* 语法高亮基础样式 */
.message-bubble :deep(.hljs-keyword),
.message-bubble :deep(.hljs-selector-tag),
.message-bubble :deep(.hljs-subst) {
  color: #d73a49;
  font-weight: bold;
}

.message-bubble :deep(.hljs-string),
.message-bubble :deep(.hljs-doctag) {
  color: #032f62;
}

.message-bubble :deep(.hljs-title),
.message-bubble :deep(.hljs-section),
.message-bubble :deep(.hljs-selector-id) {
  color: #6f42c1;
  font-weight: bold;
}

.message-bubble :deep(.hljs-comment),
.message-bubble :deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

.message-bubble :deep(.hljs-variable),
.message-bubble :deep(.hljs-template-variable),
.message-bubble :deep(.hljs-attribute),
.message-bubble :deep(.hljs-tag),
.message-bubble :deep(.hljs-name),
.message-bubble :deep(.hljs-regexp),
.message-bubble :deep(.hljs-link) {
  color: #005cc5;
}

.message-bubble :deep(.hljs-number),
.message-bubble :deep(.hljs-meta),
.message-bubble :deep(.hljs-built_in),
.message-bubble :deep(.hljs-builtin-name),
.message-bubble :deep(.hljs-literal),
.message-bubble :deep(.hljs-type),
.message-bubble :deep(.hljs-params) {
  color: #e36209;
}

.message-bubble :deep(.hljs-symbol),
.message-bubble :deep(.hljs-bullet) {
  color: #24292e;
}

.message-bubble :deep(.hljs-deletion) {
  background-color: #ffeef0;
}

.message-bubble :deep(.hljs-addition) {
  background-color: #f0fff4;
}

/* 响应式：手机端可以根据需要微调 */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>
