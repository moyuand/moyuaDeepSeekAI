import { get, put } from '@/utils/request';
import logger from '@/utils/logger';

/**
 * 会话 API 服务
 */

/**
 * 获取指定会话的详细信息
 * @param {string} taskId - 会话ID
 * @param {number} userId - 用户ID（可选，用于权限验证）
 * @returns {Promise<Object>} 会话详细信息
 */
export async function getSessionInfo(taskId, userId = null) {
  try {
    const params = userId ? { userId } : {};
    const data = await get(`/session/${taskId}`, params);

    logger.debug('Session info retrieved', { taskId, userId });
    return data;
  } catch (error) {
    logger.error('Failed to get session info', { taskId, error });
    throw error;
  }
}

/**
 * 更新会话标题
 * @param {string} taskId - 会话ID
 * @param {string} newTitle - 新标题
 * @param {number} userId - 用户ID（可选，用于权限验证）
 * @returns {Promise<Object>} 更新结果
 */
export async function updateSessionTitle(taskId, newTitle, userId = null) {
  try {
    // 验证标题
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      throw new Error('标题不能为空');
    }

    if (trimmedTitle.length > 255) {
      throw new Error('标题过长(最多255字符)');
    }

    const body = { title: trimmedTitle };
    if (userId) {
      body.userId = userId;
    }

    const data = await put(`/session/${taskId}/title`, body);

    logger.info('Session title updated', { taskId, newTitle: trimmedTitle, userId });
    return data;
  } catch (error) {
    logger.error('Failed to update session title', { taskId, newTitle, error });
    throw error;
  }
}

/**
 * 获取用户的聊天历史列表
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} 会话列表
 */
export async function getChatHistory(userId) {
  try {
    const data = await get('/history', { userId });

    logger.debug('Chat history retrieved', {
      userId,
      count: data?.tasks?.length || 0
    });

    return data;
  } catch (error) {
    logger.error('Failed to get chat history', { userId, error });
    throw error;
  }
}
