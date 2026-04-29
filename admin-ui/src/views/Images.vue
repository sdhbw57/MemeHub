<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>图片管理</span>
      </div>
    </template>

    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索图片名称" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="categoryId" placeholder="全部分类" clearable style="width: 150px" @change="handleSearch">
        <el-option label="全部分类" value="" />
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
        批量删除 ({{ selectedIds.length }})
      </el-button>
    </div>

    <el-table :data="images" @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column label="缩略图" width="100">
        <template #default="{ row }">
          <el-image :src="row.thumbnailUrl" style="width: 60px; height: 60px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="文件名" min-width="150" />
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          {{ row.category?.name || '未分类' }}
        </template>
      </el-table-column>
      <el-table-column label="尺寸" width="100">
        <template #default="{ row }">
          {{ row.width }}x{{ row.height }}
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100">
        <template #default="{ row }">
          {{ formatSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="views" label="浏览" width="80" />
      <el-table-column label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.uploadTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEditCategory(row)">修改分类</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadImages"
      @size-change="loadImages"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <el-dialog v-model="editDialogVisible" title="修改分类" width="400px">
      <el-form :model="editForm">
        <el-form-item label="图片">
          <el-image :src="editForm.thumbnailUrl" style="width: 100px; height: 100px" fit="cover" />
        </el-form-item>
        <el-form-item label="选择分类">
          <el-select v-model="editForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getImages, deleteImage, batchDeleteImages, updateImage, getCategories } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const search = ref('');
const categoryId = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const images = ref([]);
const selectedIds = ref([]);
const categories = ref([]);
const loading = ref(false);
const editDialogVisible = ref(false);
const editForm = ref({ id: null, categoryId: null, thumbnailUrl: '' });

const loadImages = async () => {
  loading.value = true;
  try {
    const res = await getImages({ page: page.value, pageSize: pageSize.value, search: search.value, categoryId: categoryId.value });
    images.value = res.data.images;
    total.value = res.data.pagination.total;
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

const handleSearch = () => {
  page.value = 1;
  loadImages();
};

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除图片 "${row.name}" 吗？`, '提示', { type: 'warning' });
    await deleteImage(row.id);
    ElMessage.success('删除成功');
    loadImages();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 张图片吗？`, '提示', { type: 'warning' });
    await batchDeleteImages(selectedIds.value);
    ElMessage.success('批量删除成功');
    selectedIds.value = [];
    loadImages();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const handleEditCategory = (row) => {
  editForm.value = { id: row.id, categoryId: row.category?.id, thumbnailUrl: row.thumbnailUrl };
  editDialogVisible.value = true;
};

const handleSaveCategory = async () => {
  if (!editForm.value.categoryId) {
    ElMessage.warning('请选择分类');
    return;
  }
  try {
    await updateImage(editForm.value.id, { categoryId: editForm.value.categoryId });
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    loadImages();
  } catch (e) {
    console.error(e);
  }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTime = (time) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadImages();
  loadCategories();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}
</style>
