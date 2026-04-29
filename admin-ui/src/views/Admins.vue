<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>管理员管理</span>
        <el-button type="primary" @click="handleCreate">新建管理员</el-button>
      </div>
    </template>

    <el-table :data="admins" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'super_admin' ? 'danger' : 'primary'">
            {{ row.role === 'super_admin' ? '超级管理员' : '管理员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后登录" width="180">
        <template #default="{ row }">
          {{ row.last_login ? new Date(row.last_login).toLocaleString('zh-CN') : '从未' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const admins = ref([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref(null);
const isEdit = ref(false);
const editId = ref(null);

const form = ref({ username: '', password: '', email: '', role: 'admin', status: 1 });

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const loadAdmins = async () => {
  loading.value = true;
  try {
    const res = await getAdmins();
    admins.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  isEdit.value = false;
  dialogTitle.value = '新建管理员';
  form.value = { username: '', password: '', email: '', role: 'admin', status: 1 };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = '编辑管理员';
  form.value = { username: row.username, password: '', email: row.email, role: row.role, status: row.status };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value) {
        await updateAdmin(editId.value, form.value);
        ElMessage.success('更新成功');
      } else {
        await createAdmin(form.value);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      loadAdmins();
    } catch (e) {
      console.error(e);
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除管理员 "${row.username}" 吗？`, '提示', { type: 'warning' });
    await deleteAdmin(row.id);
    ElMessage.success('删除成功');
    loadAdmins();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(loadAdmins);
</script>
