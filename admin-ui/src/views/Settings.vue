<template>
  <el-card>
    <template #header>
      <span>系统设置</span>
    </template>

    <el-form label-width="150px" style="max-width: 600px">
      <el-form-item label="网站名称">
        <el-input v-model="settings.site_name" @blur="saveSetting('site_name', settings.site_name)" />
      </el-form-item>
      <el-form-item label="网站描述">
        <el-input v-model="settings.site_description" type="textarea" rows="2" @blur="saveSetting('site_description', settings.site_description)" />
      </el-form-item>
      <el-divider>图片设置</el-divider>
      <el-form-item label="最大上传大小">
        <el-input-number v-model="settings.max_upload_size" :min="1" :max="50" @change="saveSetting('max_upload_size', settings.max_upload_size)" />
        <span style="margin-left: 10px">MB</span>
      </el-form-item>
      <el-form-item label="允许格式">
        <el-input v-model="settings.allowed_formats" placeholder="jpg,png,gif,webp" @blur="saveSetting('allowed_formats', settings.allowed_formats)" />
      </el-form-item>
      <el-form-item label="缩略图宽度">
        <el-input-number v-model="settings.thumbnail_width" :min="100" :max="800" @change="saveSetting('thumbnail_width', settings.thumbnail_width)" />
        <span style="margin-left: 10px">px</span>
      </el-form-item>
      <el-form-item label="缩略图高度">
        <el-input-number v-model="settings.thumbnail_height" :min="100" :max="800" @change="saveSetting('thumbnail_height', settings.thumbnail_height)" />
        <span style="margin-left: 10px">px</span>
      </el-form-item>
      <el-divider>功能开关</el-divider>
      <el-form-item label="自动分类">
        <el-switch v-model="autoCategorize" @change="saveSetting('auto_categorize', autoCategorize ? '1' : '0')" />
      </el-form-item>
      <el-form-item label="用户注册">
        <el-switch v-model="enableRegister" @change="saveSetting('enable_register', enableRegister ? '1' : '0')" />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSettings, updateSetting } from '@/api';
import { ElMessage } from 'element-plus';

const settings = ref({});
const autoCategorize = ref(false);
const enableRegister = ref(false);

const loadSettings = async () => {
  try {
    const res = await getSettings();
    settings.value = res.data;
    autoCategorize.value = settings.value.auto_categorize === '1';
    enableRegister.value = settings.value.enable_register === '1';
  } catch (e) {
    console.error(e);
  }
};

const saveSetting = async (key, value) => {
  try {
    await updateSetting({ key, value: String(value) });
    ElMessage.success('保存成功');
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadSettings);
</script>
