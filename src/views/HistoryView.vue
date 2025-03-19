<template>
  <div class="history-container">
    <n-card class="history-card">
      <template #header>
        <div class="card-header">
          <h1 class="title">聊天历史</h1>
          <n-button @click="goBack" quaternary circle>
            <template #icon>
              <n-icon size="20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="m12 20l-8-8l8-8l1.425 1.4l-5.6 5.6H20v2H7.825l5.6 5.6z"
                  />
                </svg>
              </n-icon>
            </template>
          </n-button>
        </div>
      </template>

      <div v-if="loading" class="loading-state">
        <n-spin size="medium" />
        <p>加载历史记录中...</p>
      </div>

      <div v-else-if="tasks.length === 0" class="empty-state">
        <n-empty description="暂无历史聊天记录" />
      </div>

      <div v-else>
        <n-list hoverable clickable>
          <n-list-item
            v-for="task in tasks"
            :key="task.taskId"
            @click="viewConversation(task.taskId)"
          >
            <n-thing>
              <template #avatar>
                <n-avatar round>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"
                    />
                  </svg>
                </n-avatar>
              </template>
              <template #header>
                <div class="task-header">
                  <span class="task-time">{{
                    formatDate(task.startTime)
                  }}</span>
                  <div class="task-actions">
                    <n-button
                      quaternary
                      circle
                      size="small"
                      @click.stop="confirmDeleteTask(task.taskId)"
                    >
                      <template #icon>
                        <n-icon>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M7 21q-.825 0-1.413-.588T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.588 1.413T17 21H7Zm2-4h2V8H9v9Zm4 0h2V8h-2v9Z"
                            />
                          </svg>
                        </n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
              </template>
              <template #description>
                <span class="task-activity"
                  >上次活动时间: {{ formatDate(task.lastActivity) }}</span
                >
              </template>
            </n-thing>
          </n-list-item>
        </n-list>

        <div class="pagination-wrapper">
          <n-pagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :item-count="total"
            show-size-picker
            :page-sizes="[10, 20, 30, 40]"
            @update:page="fetchHistory"
            @update:page-size="onPageSizeChange"
          />
        </div>
      </div>
    </n-card>

    <!-- 对话详情模态框 -->
    <n-modal
      v-model:show="showDetail"
      preset="card"
      title="对话详情"
      style="width: 80%; max-width: 900px"
    >
      <div v-if="detailLoading" class="loading-state">
        <n-spin size="medium" />
        <p>加载对话内容...</p>
      </div>

      <div v-else class="conversation-detail">
        <div
          v-for="(msg, index) in conversation"
          :key="index"
          class="message"
          :class="msg.role === 'user' ? 'user-message' : 'assistant-message'"
        >
          <div class="message-header">
            <strong>{{ msg.role === "user" ? "用户" : "AI" }}</strong>
            <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div
            class="message-content"
            v-html="formatContent(msg.content)"
          ></div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full">
          <n-button type="primary" @click="addToChat"> 添加到对话 </n-button>
          <n-button @click="showDetail = false">关闭</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { get, del, post } from "@/utils/request";
import { marked } from "marked";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// 加载状态
const loading = ref(true);
const detailLoading = ref(false);

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 历史记录数据
const tasks = ref([]);
const userId = ref("");

// 对话详情数据
const showDetail = ref(false);
const conversation = ref([]);
const currentTaskId = ref("");

// 返回上一页
const goBack = () => {
  router.push("/chat");
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 格式化内容，支持Markdown
const formatContent = (content) => {
  if (!content) return "";
  return marked(content);
};

// 页面大小变化处理函数
const onPageSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  fetchHistory();
};

// 获取聊天历史
const fetchHistory = async () => {
  try {
    loading.value = true;

    const result = await get("/history", {
      userId: userId.value,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
    });

    tasks.value = result.tasks || [];

    // 计算总页数
    if (result.total) {
      total.value = result.total;
    }
  } catch (error) {
    console.error("获取聊天历史失败:", error);
    message.error("获取聊天历史失败");
  } finally {
    loading.value = false;
  }
};

// 查看对话详情
const viewConversation = async (taskId) => {
  try {
    showDetail.value = true;
    detailLoading.value = true;
    currentTaskId.value = taskId;

    const result = await get(`/history/${taskId}`, {
      userId: userId.value,
    });

    conversation.value = result.messages || [];
  } catch (error) {
    console.error("获取对话详情失败:", error);
    message.error("获取对话详情失败");
    showDetail.value = false;
  } finally {
    detailLoading.value = false;
  }
};

// 确认删除任务
const confirmDeleteTask = (taskId) => {
  dialog.warning({
    title: "删除对话",
    content: "确定要删除这个对话吗？此操作不可恢复。",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => deleteTask(taskId),
  });
};

// 删除任务
const deleteTask = async (taskId) => {
  try {
    await del(`/history/${taskId}`, {
      userId: userId.value,
    });

    message.success("对话已删除");

    // 刷新列表
    fetchHistory();
  } catch (error) {
    console.error("删除对话失败:", error);
    message.error("删除对话失败");
  }
};

// 添加对话到聊天页面
const addToChat = async () => {
  try {
    // 显示加载提示
    message.loading("正在导入对话...");

    // 将当前对话存储到localStorage，供聊天页面使用（备用方案）
    localStorage.setItem(
      "importedConversation",
      JSON.stringify(conversation.value)
    );
    localStorage.setItem("importedTaskId", currentTaskId.value);

    // 向后端发送导入请求
    await post("/import-messages", {
      taskId: currentTaskId.value,
      messages: conversation.value,
      userId: userId.value,
    });

    // 关闭详情弹窗
    showDetail.value = false;

    // 跳转到聊天页面
    message.success("对话已导入，正在跳转...");
    setTimeout(() => {
      router.push("/chat");
    }, 500);
  } catch (error) {
    console.error("添加对话失败:", error);
    message.error("添加对话失败，请重试");
  }
};

onMounted(() => {
  // 获取用户ID
  const storedUserId = localStorage.getItem("userId");
  if (!storedUserId) {
    message.error("未登录用户");
    router.push("/login");
    return;
  }

  userId.value = storedUserId;

  // 获取历史记录
  fetchHistory();
});
</script>

<style scoped>
.history-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 16px;
}

.history-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.loading-state p {
  margin-top: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.task-time {
  font-weight: 500;
}

.task-activity {
  color: #666;
  font-size: 0.9rem;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 对话详情样式 */
.conversation-detail {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

.message {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.user-message {
  background-color: #f0f9ff;
  margin-left: 20px;
}

.assistant-message {
  background-color: #f8f9fa;
  margin-right: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #444;
}

.message-time {
  font-size: 0.85rem;
  color: #666;
}

.message-content {
  line-height: 1.5;
}

.message-content :deep(p) {
  margin-bottom: 0.5em;
}

.message-content :deep(pre) {
  background-color: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
