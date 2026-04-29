<template>
  <div>
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#409EFF"><Picture /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.imageCount || 0 }}</div>
              <div class="stat-label">图片总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#67C23A"><Upload /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayCount || 0 }}</div>
              <div class="stat-label">今日上传</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon class="stat-icon" color="#E6A23C"><FolderOpened /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.categoryCount || 0 }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最近上传</span>
          </template>
          <el-table :data="recentImages" style="width: 100%">
            <el-table-column label="图片" width="80">
              <template #default="{ row }">
                <el-image :src="row.thumbnailUrl" style="width: 50px; height: 50px" fit="cover" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="文件名" />
            <el-table-column prop="category" label="分类" width="100" />
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
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统状态</span>
          </template>
          <div class="system-info">
            <div class="info-item">
              <span class="label">运行时间</span>
              <span class="value">{{ formatUptime(systemStatus.uptime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">内存使用</span>
              <span class="value">{{ systemStatus.memoryUsage?.heapUsed || 0 }} MB</span>
            </div>
            <div class="info-item">
              <span class="label">Node.js</span>
              <span class="value">{{ systemStatus.nodeVersion || 'N/A' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDashboard } from '@/api';

const stats = ref({ imageCount: 0, todayCount: 0, categoryCount: 0 });
const recentImages = ref([]);
const systemStatus = ref({});

const loadDashboard = async () => {
  try {
    const res = await getDashboard();
    stats.value = res.data.stats;
    recentImages.value = res.data.recentImages;
    systemStatus.value = res.data.systemStatus;
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

const formatUptime = (seconds) => {
  if (!seconds) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let result = '';
  if (d) result += d + '天 ';
  if (h) result += h + '小时 ';
  result += m + '分钟';
  return result;
};

onMounted(loadDashboard);
</script>

<style scoped>
.mb-20 {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 48px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.system-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
  font-weight: 500;
}
</style>
