import request from '@/utils/request';

export function login(data) {
  return request.post('/admin/login', data);
}

export function logout() {
  return request.post('/admin/logout');
}

export function getUserInfo() {
  return request.get('/admin/me');
}

export function getDashboard() {
  return request.get('/admin/dashboard');
}

export function getHeartbeat() {
  return request.get('/admin/heartbeat');
}

export function getImages(params) {
  return request.get('/admin/images', { params });
}

export function deleteImage(id) {
  return request.delete(`/admin/image/${id}`);
}

export function batchDeleteImages(ids) {
  return request.post('/admin/image/batch-delete', { ids });
}

export function updateImage(id, data) {
  return request.put(`/admin/image/${id}`, data);
}

export function getCategories() {
  return request.get('/admin/categories');
}

export function createCategory(data) {
  return request.post('/admin/category', data);
}

export function updateCategory(id, data) {
  return request.put(`/admin/category/${id}`, data);
}

export function deleteCategory(id) {
  return request.delete(`/admin/category/${id}`);
}

export function getTagRules() {
  return request.get('/admin/tag-rules');
}

export function createTagRule(data) {
  return request.post('/admin/tag-rule', data);
}

export function deleteTagRule(id) {
  return request.delete(`/admin/tag-rule/${id}`);
}

export function toggleTagRule(id, isActive) {
  return request.put(`/admin/tag-rule/${id}/toggle`, { isActive });
}

export function getSettings() {
  return request.get('/admin/settings');
}

export function updateSetting(data) {
  return request.put('/admin/setting', data);
}

export function getAdmins() {
  return request.get('/admin/admins');
}

export function createAdmin(data) {
  return request.post('/admin/admin', data);
}

export function updateAdmin(id, data) {
  return request.put(`/admin/admin/${id}`, data);
}

export function deleteAdmin(id) {
  return request.delete(`/admin/admin/${id}`);
}

export function getLogs(params) {
  return request.get('/admin/logs', { params });
}
