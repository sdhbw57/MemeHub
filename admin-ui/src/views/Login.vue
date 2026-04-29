<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>MemeHub 后台管理</h2>
          <p>请输入管理员账号登录</p>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { login, getUserInfo } from '@/api';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await login(form);
      userStore.setToken(res.data.token);
      userStore.setUser(res.data.user);
      ElMessage.success('登录成功');
      router.push('/');
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin-bottom: 8px;
  color: #333;
}

.login-header p {
  color: #999;
  font-size: 14px;
}
</style>
