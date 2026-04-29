<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>操作日志</span>
      </div>
    </template>

    <div class="toolbar">
      <el-input v-model="action" placeholder="搜索操作" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <el-table :data="logs" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="action" label="操作" width="150">
        <template #default="{ row }">
          <el-tag size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="管理员" width="120">
        <template #default="{ row }">
          {{ row.admin_name || '系统' }}
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="150" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadLogs"
      @size-change="loadLogs"
      style="margin-top: 20px; justify-content: flex-end"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getLogs } from '@/api';

const action = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const logs = ref([]);
const loading = ref(false);

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await getLogs({ page: page.value, pageSize: pageSize.value, action: action.value });
    logs.value = res.data.logs;
    total.value = res.data.pagination.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  loadLogs();
};

const formatTime = (time) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(loadLogs);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}
</style>
