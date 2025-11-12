import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

// 注册常用语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

// 配置marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('代码高亮失败:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
  headerIds: false
});

// DOMPurify配置
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'hr', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout']
};

/**
 * 安全地渲染Markdown
 * @param {string} text - Markdown文本
 * @returns {string} 清理后的HTML
 */
export function safeMarkdown(text) {
  if (!text) return '';

  try {
    // 先用marked渲染Markdown
    const rawHtml = marked(text);
    // 再用DOMPurify清理HTML
    const cleanHtml = DOMPurify.sanitize(rawHtml, purifyConfig);
    return cleanHtml;
  } catch (error) {
    console.error('Markdown渲染失败:', error);
    // 如果渲染失败,返回纯文本(去除所有HTML标签)
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }
}
