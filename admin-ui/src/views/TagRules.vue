<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>标签规则（自动分类）</span>
        <el-button type="primary" @click="handleCreate">新建规则</el-button>
      </div>
    </template>

    <el-table :data="rules" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="tag" label="标签" width="150" />
      <el-table-column label="分类" width="150">
        <template #default="{ row }">
          {{ row.category_name || '未知' }}
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">
            {{ row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-switch v-model="row.is_active" active-text="启用" inactive-text="禁用" @change="handleToggle(row)" />
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新建标签规则" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标签" prop="tag">
          <el-input v-model="form.tag" placeholder="请输入标签关键词（如 cat）" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="form.priority" :min="0" :max="100" />
          <span style="font-size: 12px; color: #999; margin-left: 10px">数值越大优先级越高</span>
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
import { getTagRules, createTagRule, deleteTagRule, toggleTagRule, getCategories } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const rules = ref([]);
const categories = ref([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);

const form = ref({ tag: '', categoryId: null, priority: 0 });

const formRules = {
  tag: [{ required: true, message: '请输入标签', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
};

const loadRules = async () => {
  loading.value = true;
  try {
    const res = await getTagRules();
    rules.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await getCategories();
    categories.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const handleCreate = () => {
  form.value = { tag: '', categoryId: null, priority: 0 };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await createTagRule(form.value);
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadRules();
    } catch (e) {
      console.error(e);
    } finally {
      submitting.value = false;
    }
  });
};

const handleToggle = async (row) => {
  try {
    await toggleTagRule(row.id, row.is_active);
    ElMessage.success(row.is_active ? '已启用' : '已禁用');
  } catch (e) {
    row.is_active = !row.is_active;
    console.error(e);
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除标签规则 "${row.tag}" 吗？`, '提示', { type: 'warning' });
    await deleteTagRule(row.id);
    ElMessage.success('删除成功');
    loadRules();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(() => {
  loadRules();
  loadCategories();
});
</script>
