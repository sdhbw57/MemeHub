<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1>欢迎回来，管理员</h1>
        <p>这是您的 MemeHub 数据概览</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="loadDashboard" :loading="loading">刷新数据</el-button>
      </div>
    </div>

    <el-row :gutter="24" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-1 glass" :class="{ 'stat-card-animate': mounted }">
          <div class="stat-card-content">
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><Picture /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.imageCount || 0 }}</span>
              <span class="stat-label">图片总数</span>
              <div class="stat-trend up">
                <el-icon><TrendCharts /></el-icon>
                <span>+12%</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-2 glass" :class="{ 'stat-card-animate': mounted }">
          <div class="stat-card-content">
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><Upload /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayCount || 0 }}</span>
              <span class="stat-label">今日上传</span>
              <div class="stat-trend up">
                <el-icon><TrendCharts /></el-icon>
                <span>+8%</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-3 glass" :class="{ 'stat-card-animate': mounted }">
          <div class="stat-card-content">
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.categoryCount || 0 }}</span>
              <span class="stat-label">分类数量</span>
              <div class="stat-trend neutral">
                <el-icon><Minus /></el-icon>
                <span>持平</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-4 glass" :class="{ 'stat-card-animate': mounted }">
          <div class="stat-card-content">
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><Coin /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatSize(stats.totalSize || 0) }}</span>
              <span class="stat-label">存储用量</span>
              <div class="stat-trend down">
                <el-icon><Bottom /></el-icon>
                <span>正常</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataLine /></el-icon>
                上传趋势
              </span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><PieChart /></el-icon>
                分类分布
              </span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container-pie"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Histogram /></el-icon>
                浏览量排行
              </span>
            </div>
          </template>
          <div ref="barChartRef" class="chart-container-bar"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="activity-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                快捷操作
              </span>
            </div>
          </template>
          <div class="quick-actions">
            <router-link to="/images" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><Upload /></el-icon>
              </div>
              <span>上传图片</span>
            </router-link>
            <router-link to="/categories" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <span>管理分类</span>
            </router-link>
            <router-link to="/settings" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><Setting /></el-icon>
              </div>
              <span>系统设置</span>
            </router-link>
            <router-link to="/logs" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Document /></el-icon>
              </div>
              <span>查看日志</span>
            </router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="bottom-row">
      <el-col :xs="24" :lg="16">
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                最近上传
              </span>
              <router-link to="/images" class="view-more">查看更多</router-link>
            </div>
          </template>
          <div class="recent-images">
            <div v-for="img in recentImages" :key="img.id" class="recent-image-item">
              <el-image :src="img.thumbnailUrl" :alt="img.name" fit="cover" class="recent-thumb" />
              <div class="recent-info">
                <span class="recent-name">{{ img.name }}</span>
                <span class="recent-meta">{{ img.category }} · {{ formatSize(img.fileSize) }}</span>
              </div>
              <span class="recent-time">{{ formatTimeAgo(img.uploadTime) }}</span>
            </div>
            <el-empty v-if="!recentImages.length" description="暂无上传记录" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="system-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Monitor /></el-icon>
                系统状态
              </span>
            </div>
          </template>
          <div class="system-status">
            <div class="status-item">
              <div class="status-header">
                <span class="status-label">运行时间</span>
                <el-tag size="small" type="success" effect="dark">在线</el-tag>
              </div>
              <span class="status-value">{{ formatUptime(systemStatus.uptime) }}</span>
            </div>
            <el-divider />
            <div class="status-item">
              <span class="status-label">内存使用</span>
              <div class="memory-bar">
                <el-progress :percentage="memoryPercentage" :color="memoryColor" :show-text="false" />
                <span class="memory-text">{{ systemStatus.memoryUsage?.heapUsed || 0 }} / {{ systemStatus.memoryUsage?.heapTotal || 0 }} MB</span>
              </div>
            </div>
            <el-divider />
            <div class="status-item">
              <span class="status-label">Node.js 版本</span>
              <span class="status-value">{{ systemStatus.nodeVersion || 'N/A' }}</span>
            </div>
            <el-divider />
            <div class="status-item">
              <span class="status-label">服务器时间</span>
              <span class="status-value">{{ currentTime }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { getDashboard, getHeartbeat } from '@/api';
import { Picture, Upload, FolderOpened, Coin, TrendCharts, Minus, Bottom, DataLine, PieChart, Histogram, Clock, Setting, Document, Monitor, Refresh } from '@element-plus/icons-vue';

const mounted = ref(false);
const loading = ref(false);
const chartPeriod = ref('week');
const currentTime = ref('');

const stats = ref({ imageCount: 0, todayCount: 0, categoryCount: 0, totalSize: 0 });
const recentImages = ref([]);
const systemStatus = ref({ memoryUsage: {} });
const categoryData = ref([]);
const trendData = ref([]);

const trendChartRef = ref(null);
const pieChartRef = ref(null);
const barChartRef = ref(null);

let trendChart = null;
let pieChart = null;
let barChart = null;

let timeTimer = null;
let heartbeatTimer = null;
const lastHeartbeat = ref(0);

const memoryPercentage = computed(() => {
  const used = systemStatus.value.memoryUsage?.heapUsed || 0;
  const total = systemStatus.value.memoryUsage?.heapTotal || 1;
  return Math.round((used / total) * 100);
});

const memoryColor = computed(() => {
  const pct = memoryPercentage.value;
  if (pct < 50) return '#67c23a';
  if (pct < 80) return '#e6a23c';
  return '#f56c6c';
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const res = await getDashboard();
    stats.value = res.data.stats;
    recentImages.value = res.data.recentImages;
    systemStatus.value = res.data.systemStatus;
    categoryData.value = res.data.categoryStats || [];
    trendData.value = res.data.trendData || [];
    updateCharts();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const heartbeat = async () => {
  try {
    const res = await getHeartbeat();
    const data = res.data;
    if (data.timestamp && data.timestamp <= lastHeartbeat.value) return;
    lastHeartbeat.value = data.timestamp || Date.now();
    stats.value = data.stats;
    categoryData.value = data.categoryStats || [];
    trendData.value = data.trendData || [];
    if (data.recentImages) recentImages.value = data.recentImages;
    updateCharts();
  } catch (e) {
    console.error('Heartbeat failed:', e);
  }
};

const updateCharts = () => {
  if (trendChart) trendChart.setOption(getTrendOption());
  if (pieChart) pieChart.setOption(getPieOption());
  if (barChart) barChart.setOption(getBarOption());
};

const getTrendOption = () => {
  const dates = [];
  const counts = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    dates.push(`${month}/${day}`);
    const found = trendData.value.find(item => item.date === dateStr);
    counts.push(found ? found.count : 0);
  }

  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#eee', textStyle: { color: '#333' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' }
    },
    series: [{
      name: '上传量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#667eea' },
      itemStyle: { color: '#667eea', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102,126,234,0.3)' },
          { offset: 1, color: 'rgba(102,126,234,0.05)' }
        ])
      },
      data: counts
    }]
  };
};

const getPieOption = () => {
  const colors = ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#faad14', '#eb2f96', '#13c2c2', '#52c41a'];
  const data = categoryData.value.length > 0
    ? categoryData.value.map((item, index) => ({
        value: item.count,
        name: item.name,
        itemStyle: { color: colors[index % colors.length] }
      }))
    : [{ value: 0, name: '暂无数据', itemStyle: { color: '#f0f0f0' } }];

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#666' } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data
    }]
  };
};

const getBarOption = () => ({
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#eee', textStyle: { color: '#333' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: recentImages.value.slice(0, 5).map(img => img.name.substring(0, 10)),
    axisLine: { lineStyle: { color: '#e0e0e0' } },
    axisLabel: { color: '#666', rotate: 15 }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
    axisLabel: { color: '#666' }
  },
  series: [{
    type: 'bar',
    barWidth: '50%',
    itemStyle: {
      borderRadius: [8, 8, 0, 0],
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#667eea' },
        { offset: 1, color: '#764ba2' }
      ])
    },
    data: recentImages.value.slice(0, 5).map(img => img.views || Math.floor(Math.random() * 1000))
  }]
});

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    trendChart.setOption(getTrendOption());
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
    pieChart.setOption(getPieOption());
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
    barChart.setOption(getBarOption());
  }
};

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTimeAgo = (time) => {
  if (!time) return '';
  const diff = Date.now() - new Date(time).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
};

const formatUptime = (seconds) => {
  if (!seconds) return '0分钟';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let result = '';
  if (d) result += d + '天 ';
  if (h) result += h + '小时 ';
  result += m + '分钟';
  return result;
};

watch(chartPeriod, () => {
  updateCharts();
});

onMounted(() => {
  setTimeout(() => { mounted.value = true; }, 100);
  loadDashboard();
  initCharts();
  updateTime();
  timeTimer = setInterval(updateTime, 1000);
  heartbeatTimer = setInterval(heartbeat, 30000);
  window.addEventListener('resize', () => {
    trendChart?.resize();
    pieChart?.resize();
    barChart?.resize();
  });
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  trendChart?.dispose();
  pieChart?.dispose();
  barChart?.dispose();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #e8ecf5 0%, #dce3f0 50%, #e6eaf5 100%);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(102,126,234,0.3);
}

.welcome-section h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.welcome-section p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.header-actions :deep(.el-button) {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
}

.header-actions :deep(.el-button:hover) {
  background: rgba(255,255,255,0.35);
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 24px;
  color: #fff;
  min-height: 150px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s ease-out;
}

.stat-card-animate {
  opacity: 1;
  transform: translateY(0);
}

.stat-card:nth-child(1) { transition-delay: 0.1s; }
.stat-card:nth-child(2) { transition-delay: 0.2s; }
.stat-card:nth-child(3) { transition-delay: 0.3s; }
.stat-card:nth-child(4) { transition-delay: 0.4s; }

.glass {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.stat-card-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.stat-card-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.stat-card-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.stat-card-4 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 28px;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.stat-label {
  display: block;
  font-size: 13px;
  opacity: 0.95;
  margin-top: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.stat-trend.up { }
.stat-trend.down { }
.stat-trend.neutral { }

.charts-row {
  margin-bottom: 24px;
}

.chart-card, .recent-card, .activity-card, .system-card {
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.chart-card :deep(.el-card__header),
.recent-card :deep(.el-card__header),
.activity-card :deep(.el-card__header),
.system-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(240, 240, 240, 0.8);
  padding: 16px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.view-more {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
}

.view-more:hover {
  text-decoration: underline;
}

.chart-container {
  height: 280px;
  width: 100%;
}

.chart-container-pie {
  height: 240px;
  width: 100%;
}

.chart-container-bar {
  height: 240px;
  width: 100%;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-decoration: none;
  color: #606266;
  font-size: 13px;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.recent-images {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-image-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.5);
}

.recent-image-item:hover {
  background: rgba(255, 255, 255, 0.85);
}

.recent-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.recent-info {
  flex: 1;
  min-width: 0;
}

.recent-name {
  display: block;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-meta {
  font-size: 12px;
  color: #909399;
}

.recent-time {
  font-size: 12px;
  color: #c0c4cc;
  white-space: nowrap;
}

.system-status {
  padding: 8px 0;
}

.status-item {
  padding: 8px 0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.status-label {
  font-size: 13px;
  color: #909399;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.memory-bar {
  margin-top: 4px;
}

.memory-text {
  display: block;
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.bottom-row {
  margin-bottom: 24px;
}

:deep(.el-divider) {
  margin: 12px 0;
}

:deep(.el-radio-button__inner) {
  border-radius: 8px;
}
</style>
