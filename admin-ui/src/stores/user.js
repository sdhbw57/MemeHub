import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('admin_token') || '');

  function setUser(userData) {
    user.value = userData;
  }

  function setToken(tokenValue) {
    token.value = tokenValue;
    localStorage.setItem('admin_token', tokenValue);
  }

  function logout() {
    user.value = null;
    token.value = '';
    localStorage.removeItem('admin_token');
  }

  return { user, token, setUser, setToken, logout };
});
