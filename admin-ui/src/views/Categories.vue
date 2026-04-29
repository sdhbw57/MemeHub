<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>分类管理</span>
        <el-button type="primary" @click="handleCreate">新建分类</el-button>
      </div>
    </template>

    <el-table :data="categories" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="slug" label="标识符" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="image_count" label="图片数" width="100" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标识符" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入标识符（英文）" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
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
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const categories = ref([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref(null);
const isEdit = ref(false);
const editId = ref(null);

const form = ref({ name: '', slug: '', description: '', sortOrder: 0 });

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入标识符', trigger: 'blur' }]
};

const loadCategories = async () => {
  loading.value = true;
  try {
    const res = await getCategories();
    categories.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  isEdit.value = false;
  dialogTitle.value = '新建分类';
  form.value = { name: '', slug: '', description: '', sortOrder: 0 };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = '编辑分类';
  form.value = { name: row.name, slug: row.slug, description: row.description, sortOrder: row.sort_order };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value) {
        await updateCategory(editId.value, form.value);
        ElMessage.success('更新成功');
      } else {
        await createCategory(form.value);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      loadCategories();
    } catch (e) {
      console.error(e);
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？`, '提示', { type: 'warning' });
    await deleteCategory(row.id);
    ElMessage.success('删除成功');
    loadCategories();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(loadCategories);
</script>
