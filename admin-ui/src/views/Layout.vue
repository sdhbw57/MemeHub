<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">
        <h3>MemeHub</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/images">
          <el-icon><Picture /></el-icon>
          <span>图片管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><FolderOpened /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/tag-rules">
          <el-icon><PriceTag /></el-icon>
          <span>标签规则</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="/admins" v-if="userStore.user?.role === 'super_admin'">
          <el-icon><UserFilled /></el-icon>
          <span>管理员</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="username">{{ userStore.user?.username }}</span>
          <el-dropdown @command="handleCommand">
            <el-avatar :size="32">{{ userStore.user?.username?.charAt(0)?.toUpperCase() }}</el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getUserInfo, logout as apiLogout } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);
const currentTitle = computed(() => route.meta.title || '');

onMounted(async () => {
  if (!userStore.user) {
    try {
      const res = await getUserInfo();
      userStore.setUser(res.data);
    } catch (e) {
      router.push('/login');
    }
  }
});

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await apiLogout();
    } catch (e) {}
    userStore.logout();
    router.push('/login');
    ElMessage.success('已退出登录');
  }
};
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h3 {
  color: #fff;
  font-size: 18px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
