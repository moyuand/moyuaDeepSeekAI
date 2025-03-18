import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: () => {
        // 如果已登录则进入主页，否则进入登录页
        return localStorage.getItem("userId")
          ? { name: "home" }
          : { name: "login" };
      },
    },
    {
      path: "/chat",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("../views/SettingsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/history",
      name: "history",
      component: () => import("../views/HistoryView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查是否有用户ID（基本登录检查）
  const isLoggedIn = !!localStorage.getItem("userId");
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  // 页面标题更新
  document.title = to.meta.title || "墨鱼AI智能助手";

  // 登录状态检测
  if (requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，保存目标路径并重定向到登录页
    next({
      name: "login",
      query: { redirect: to.fullPath }, // 保存用户要访问的页面路径
    });
    return;
  }

  // 已登录用户访问登录页时直接跳转到首页
  if (to.name === "login" && isLoggedIn) {
    next({ name: "home" });
    return;
  }

  // 正常导航
  next();
});

// 全局解析守卫（在导航被确认之前，同时在组件被解析之后）
router.beforeResolve(async (to, from, next) => {
  try {
    // 添加额外的API令牌验证，只对需要认证的路由执行
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      const userId = localStorage.getItem("userId");
      const apiKey = localStorage.getItem("apiKey");

      // 如果已登录但页面刷新导致缺少必要信息，尝试重新获取
      if (!userId || !apiKey) {
        // 跳转到登录页
        next({ name: "login" });
        return;
      }

      // 这里可以添加与后端验证令牌有效性的逻辑
      // const isValid = await verifyApiKey(apiKey);
      // if (!isValid) {
      //   // API密钥无效，清除登录状态
      //   localStorage.removeItem("userId");
      //   localStorage.removeItem("username");
      //   localStorage.removeItem("apiKey");
      //
      //   next({ name: 'login' });
      //   return;
      // }
    }

    next();
  } catch (error) {
    console.error("路由解析错误:", error);
    next({ name: "login" });
  }
});

export default router;
