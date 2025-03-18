<template>
  <n-message-provider>
    <!-- 整个页面使用 flex-column 布局 -->
    <div class="chat-container">
      <n-page-header title="墨鱼AI智能助手" class="p-4">
        <template #avatar>
          <n-avatar class="text-blue-500 bg-blue-100" round>AI</n-avatar>
        </template>
        <template #extra>
          <n-space>
            <n-select
              v-model:value="selectedModel"
              :options="options"
              placeholder="请选择模型"
              @update-value="handleUpdateModel"
            />

            <n-dropdown
              trigger="click"
              :options="userMenuOptions"
              @select="handleSelect"
            >
              <n-avatar round size="small" class="cursor-pointer user-avatar">
                {{ getAvatarText() }}
              </n-avatar>
            </n-dropdown>
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
          round
          v-model:value="content"
          placeholder="请输入对话内容"
          @keydown.enter="sendMessage"
        />
        <div class="btn-group">
          <n-upload
            ref="uploadRef"
            :custom-request="customRequest"
            :headers="{
              'naive-info': 'hello!',
            }"
            :data="{
              'naive-data': 'cool! naive!',
            }"
            :max="1"
            @before-upload="beforeUpload"
            @remove="handleRemove"
            list-type="image-card"
          >
            <n-button circle quaternary>
              <n-icon size="36">
                <AddCircle32Filled />
              </n-icon>
            </n-button>
          </n-upload>

          <n-button
            circle
            @click="isGenerating ? stopGeneration() : sendMessage()"
            type="primary"
          >
            <n-icon size="22">
              <template v-if="isGenerating">
                <Stop24Filled />
              </template>
              <template v-else>
                <Send24Filled />
              </template>
            </n-icon>
          </n-button>
          <n-button @click="clearConversation" quaternary circle>
            <n-icon size="22">
              <Delete16Filled />
            </n-icon>
          </n-button>
        </div>
      </div>
    </div>
  </n-message-provider>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from "vue";
import { marked } from "marked";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import {
  Send24Filled,
  Stop24Filled,
  Delete16Filled,
  AddCircle32Filled,
} from "@vicons/fluent";
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

// 添加文件上传状态跟踪变量
const hasUploadedFile = ref(false);
// 文件上传组件引用
const uploadRef = ref(null);
// 当前上传的文件ID，用于跟踪
const currentFileId = ref(null);

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
  try {
    const result = await post("/updateModel", { model: value });
    content.value = "";
    conversationHistory.value = [];
    currentTaskId.value = null;
    console.log("更新模型结果：", result);
    message.success(`已切换到${value}模型`);
  } catch (error) {
    message.error(error.message || "切换模型失败");
    console.error("更新模型失败:", error);
  }
};

// 处理文件移除事件
const handleRemove = () => {
  console.log("文件已手动移除");
  hasUploadedFile.value = false;
  content.value = ""; // 清空内容框中的图片URL
  currentFileId.value = null;
};

// 上传文件
const customRequest = async (data) => {
  try {
    console.log("开始上传文件：", data.file.file);
    // 生成唯一文件ID
    currentFileId.value = Date.now().toString();

    const result = await upload("/upload", data.file.file);
    console.log("上传文件结果：", result);
    if (result.code === 0) {
      message.success("上传成功");
      content.value = result.data.url;
      hasUploadedFile.value = true; // 设置文件上传状态为true
      console.log("已设置hasUploadedFile=true，当前值:", hasUploadedFile.value);
    } else {
      message.error(result.message || "上传失败");
      currentFileId.value = null;
      hasUploadedFile.value = false;

      // 上传失败时清空文件列表
      if (uploadRef.value) {
        try {
          console.log("上传失败，清空文件列表");
          uploadRef.value.clear();
        } catch (e) {
          console.error("清空文件列表失败:", e);
        }
      }
    }
  } catch (error) {
    console.error("上传出错：", error);
    message.error(error.message || "上传失败");
    currentFileId.value = null;
    hasUploadedFile.value = false;

    // 上传出错时清空文件列表
    if (uploadRef.value) {
      try {
        console.log("上传出错，清空文件列表");
        uploadRef.value.clear();
      } catch (e) {
        console.error("清空文件列表失败:", e);
      }
    }
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

  // 添加日志，检查上传状态
  console.log("发送消息前，文件上传状态：", hasUploadedFile.value);

  // 先将用户消息 push 到对话记录
  conversationHistory.value.push({
    role: "user",
    content: content.value,
  });

  // 滚动到最新消息
  scrollToBottom();

  try {
    // 判断是首次还是后续
    if (!currentTaskId.value) {
      // 第一次：POST /start
      console.log("调用start接口，imageData=", hasUploadedFile.value);
      const result = await post("/start", {
        content: content.value,
        userId: userId.value,
        imageData: hasUploadedFile.value,
      });

      if (!result.taskId) {
        throw new Error("服务器未返回有效的taskId");
      }

      taskId = result.taskId;
      currentTaskId.value = taskId;
    } else {
      // 后续：POST /continue
      console.log("调用continue接口，imageData=", hasUploadedFile.value);
      taskId = currentTaskId.value;
      await post("/continue", {
        taskId,
        content: content.value,
        userId: userId.value,
        imageData: hasUploadedFile.value,
      });
    }

    // 清空输入框
    content.value = "";

    // 重置文件上传状态并主动清空文件列表
    if (hasUploadedFile.value) {
      console.log("准备清空文件列表和重置状态");
      // 手动清空文件列表 - 使用Naive UI的方法
      hasUploadedFile.value = false;
      currentFileId.value = null;

      // 给DOM一点时间更新
      setTimeout(() => {
        if (uploadRef.value) {
          try {
            console.log("清空文件列表");
            // 使用更直接的方式清空
            uploadRef.value.clear();
            // 直接操作文件列表DOM元素(备用方案)
            const fileListEl = document.querySelector(".n-upload-file-list");
            if (fileListEl) {
              fileListEl.innerHTML = "";
            }
          } catch (e) {
            console.error("清空文件列表失败:", e);
          }
        }
      }, 100);
    }

    // 建立 SSE 连接
    doSSE(taskId);
  } catch (error) {
    // 显示错误信息
    message.error(error.message || "发送消息失败");
    console.error("发送消息失败:", error);

    // 从对话记录中移除最后一条消息
    if (conversationHistory.value.length > 0) {
      conversationHistory.value.pop();
    }
  }
};

// 添加连接检测和重连机制
let connectionCheckInterval = null;

// 检查连接状态并在需要时重连
// eslint-disable-next-line no-unused-vars
const checkConnection = () => {
  if (currentTaskId.value && !currentEvtSource) {
    console.log("检测到连接已断开，尝试重新连接...");
    doSSE(currentTaskId.value);
  }
};

/**
 * 建立 SSE，实时接收 AI 消息
 */
const doSSE = (taskId) => {
  // 设置生成状态为true
  isGenerating.value = true;

  // 创建并保存EventSource实例
  // 使用配置的API代理访问后端
  currentEvtSource = new EventSource(
    `/api/events?taskId=${taskId}&userId=${userId.value || ""}`
  );

  // 在对话历史中新建一条空的 AI 消息，准备拼接思考过程和结果
  conversationHistory.value.push({
    role: "assistant",
    reasoning: "",
    content: "",
  });
  const currentIndex = conversationHistory.value.length - 1;

  // 添加超时保护，防止长时间无响应
  const connectionTimeout = setTimeout(() => {
    console.log("EventSource连接超时，自动关闭");
    message.warning("AI响应超时，请重试");
    closeEventSource();

    // 添加超时提示到消息中
    if (conversationHistory.value[currentIndex]) {
      conversationHistory.value[currentIndex].content +=
        "\n\n**[系统提示]** 响应超时，请重试";
    }
  }, 60000); // 60秒超时

  // 添加统一的关闭EventSource函数
  const closeEventSource = () => {
    if (currentEvtSource) {
      console.log("关闭EventSource连接");
      currentEvtSource.close();
      currentEvtSource = null;
      isGenerating.value = false;

      // 清除超时定时器
      clearTimeout(connectionTimeout);
    }
  };

  currentEvtSource.onmessage = (e) => {
    // 处理完成信号 - 增加对status: completed的判断
    if (
      e.data === "[DONE]" ||
      e.data.includes('"status": "completed"') ||
      e.data.includes('"status":"completed"')
    ) {
      closeEventSource();
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
    } else if (e.data.startsWith("[error]")) {
      // 处理错误信息
      const errorMsg = e.data.replace("[error]", "");
      const decodedError = decodeURIComponent(errorMsg);
      message.error(decodedError || "AI响应出错");
      conversationHistory.value[currentIndex].content +=
        `\n\n**[错误]** ${decodedError}`;
      closeEventSource();
      scrollToBottom();
    } else {
      console.log("Other SSE data:", e.data);
      // 检查是否包含完成信息或错误信息
      try {
        const data = JSON.parse(e.data);
        if (data.status === "completed") {
          closeEventSource();
          scrollToBottom();
        } else if (data.error) {
          message.error(data.error || "AI响应出错");
          conversationHistory.value[currentIndex].content +=
            `\n\n**[错误]** ${data.error}`;
          closeEventSource();
          scrollToBottom();
        }
      } catch (error) {
        // 非JSON格式，忽略错误
        console.debug("非JSON格式数据:", e.data, "解析错误:", error.message);
      }
    }
  };

  currentEvtSource.onopen = () => {
    console.log("EventSource连接已打开");
  };

  currentEvtSource.onerror = (err) => {
    console.error("EventSource 错误:", err);
    message.error("连接错误，请刷新页面重试");

    // 在消息中显示错误提示
    if (conversationHistory.value[currentIndex]) {
      conversationHistory.value[currentIndex].content +=
        "\n\n**[系统错误]** 连接中断，请刷新页面重试";
    }

    closeEventSource();
  };

  // 在组件卸载时确保清理连接
  onUnmounted(() => {
    closeEventSource();
  });
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

  // 确保在页面离开或刷新时关闭连接
  window.addEventListener("beforeunload", () => {
    if (currentEvtSource) {
      currentEvtSource.close();
    }
  });
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

  // 重置文件上传状态并清空文件列表
  hasUploadedFile.value = false;
  if (uploadRef.value) {
    uploadRef.value.clear();
  }

  try {
    const result = await get("/clear");
    console.log("清空对话结果：", result);
    message.success("对话已清空");
  } catch (error) {
    console.error("清空对话失败:", error);
    message.error(error.message || "清空对话失败");
  }
};

// 在组件卸载时清理定时器
onUnmounted(() => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  if (currentEvtSource) {
    currentEvtSource.close();
  }
});

// 添加一个保活机制，定期向服务器发送请求
const keepAlive = async () => {
  if (currentTaskId.value) {
    try {
      await get(`/keepalive?taskId=${currentTaskId.value}`);
    } catch (error) {
      console.error("保活请求失败:", error);
    }
  }
};

// 设置保活定时器，比如每5分钟发送一次
const keepAliveInterval = setInterval(keepAlive, 5 * 60 * 1000);

onUnmounted(() => {
  clearInterval(keepAliveInterval);
});

const router = useRouter();

// 用户菜单选项
const userMenuOptions = computed(() => {
  return [
    {
      label: "历史记录",
      key: "history",
    },
    {
      label: "设置",
      key: "settings",
    },
    {
      type: "divider",
      key: "divider",
    },
    {
      label: "退出登录",
      key: "logout",
    },
  ];
});

// 获取头像显示文本
const getAvatarText = () => {
  const username = localStorage.getItem("username");
  if (!username) return "U";
  return username.charAt(0).toUpperCase();
};

// 处理菜单选择
const handleSelect = (key) => {
  switch (key) {
    case "history":
      router.push("/history");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "home":
      router.push("/chat");
      break;
    case "logout":
      // 清除本地存储数据
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("apiKey");

      // 跳转到登录页
      router.push("/login");
      break;
  }
};
</script>

<style scoped>
/* 整个页面充满视口，高度 100vh */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--n-color-background);
}

/* 聊天记录区域自动占满上方剩余空间，并支持滚动 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--n-color-card);
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
  background-color: var(--n-color-card);
  color: var(--n-text-color);
}

/* 用户气泡（右侧，绿色背景） */
.user .message-bubble {
  background-color: var(--n-primary-color-hover);
}

/* AI 气泡（左侧，灰色背景） */
.assistant .message-bubble {
  background-color: var(--n-color-modal);
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

:deep() .n-upload-trigger.n-upload-trigger--image-card {
  height: 48px;
  width: 48px;
}
:deep() .n-upload-file-list .n-upload-file.n-upload-file--image-card-type {
  height: 48px;
  width: 48px;
}
:deep() .n-upload-file-list.n-upload-file-list--grid {
  grid-template-columns: repeat(auto-fill, 48px);
}
</style>
