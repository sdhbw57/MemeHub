const API_BASE = '';

let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let totalPages = 1;
let selectedFile = null;

async function init() {
    await loadCategories();
    await loadImages();
    setupEventListeners();
}

async function loadCategories(retries = 3) {
    try {
        const res = await fetch(`${API_BASE}/api/categories`, {
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.code === 200) {
            renderCategories(data.data);
            renderUploadCategorySelect(data.data);
        }
    } catch (err) {
        console.error('Failed to load categories:', err);
        if (retries > 0) {
            console.log(`Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await loadCategories(retries - 1);
        } else {
            showToast('加载分类失败，请刷新页面重试');
        }
    }
}

function renderCategories(categories) {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = '<button class="category-btn active" data-id="">全部</button>';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat.name;
        btn.dataset.id = cat.id;
        nav.appendChild(btn);
    });
}

function renderUploadCategorySelect(categories) {
    const select = document.getElementById('uploadCategory');
    select.innerHTML = '<option value="">无分类</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

async function loadImages(retries = 3) {
    const grid = document.getElementById('imageGrid');
    const loading = document.getElementById('loading');
    
    grid.innerHTML = '';
    loading.classList.remove('hidden');
    
    try {
        const params = new URLSearchParams({ page: currentPage, pageSize: 20 });
        if (currentCategory) params.append('categoryId', currentCategory);
        if (currentSearch) params.append('search', currentSearch);
        
        const res = await fetch(`${API_BASE}/api/images?${params}`, {
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.code === 200) {
            renderImages(data.data.images);
            totalPages = data.data.pagination.totalPages;
            renderPagination();
        }
    } catch (err) {
        console.error('Failed to load images:', err);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await loadImages(retries - 1);
        } else {
            showToast('加载失败，请刷新页面重试');
        }
    } finally {
        loading.classList.add('hidden');
    }
}

function renderImages(images) {
    const grid = document.getElementById('imageGrid');
    
    if (images.length === 0) {
        grid.innerHTML = '<div class="empty-state">暂无图片，快去上传吧~</div>';
        return;
    }
    
    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `<img src="${img.thumbnailUrl}" alt="${img.originalName}" loading="lazy">`;
        card.addEventListener('click', () => showImageDetail(img.id));
        grid.appendChild(card);
    });
}

function renderPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        currentPage--;
        loadImages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(prevBtn);
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        container.appendChild(createPageButton(1));
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.cssText = 'padding: 0 8px; color: rgba(0,0,0,0.4); align-self: center;';
            container.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createPageButton(i));
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.cssText = 'padding: 0 8px; color: rgba(0,0,0,0.4); align-self: center;';
            container.appendChild(dots);
        }
        container.appendChild(createPageButton(totalPages));
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        currentPage++;
        loadImages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(nextBtn);
}

function createPageButton(page) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn' + (page === currentPage ? ' active' : '');
    btn.textContent = page;
    btn.addEventListener('click', () => {
        currentPage = page;
        loadImages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return btn;
}

async function showImageDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/api/image/${id}`);
        const data = await res.json();
        
        if (data.code === 200) {
            const img = data.data;
            
            document.getElementById('detailTitle').textContent = img.originalName;
            document.getElementById('detailImage').src = img.directUrl;
            document.getElementById('detailCategory').textContent = img.categoryName || '无';
            document.getElementById('detailSize').textContent = img.width + ' x ' + img.height;
            document.getElementById('detailFileSize').textContent = formatFileSize(img.fileSize);
            document.getElementById('detailTime').textContent = new Date(img.uploadTime).toLocaleString('zh-CN');
            document.getElementById('detailViews').textContent = img.views;
            
            document.getElementById('shareDirect').value = img.urls.direct;
            document.getElementById('shareMarkdown').value = img.urls.markdown;
            document.getElementById('shareHtml').value = img.urls.html;
            
            document.getElementById('detailModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        console.error('Failed to load image detail:', err);
        showToast('加载详情失败');
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function setupEventListeners() {
    document.getElementById('categoryNav').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            e.target.classList.add('active');
            
            currentCategory = e.target.dataset.id;
            currentPage = 1;
            loadImages();
        }
    });
    
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        currentSearch = document.getElementById('searchInput').value.trim();
        currentPage = 1;
        loadImages();
    });
    
    document.getElementById('uploadBtn').addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    document.getElementById('closeUpload').addEventListener('click', closeUploadModal);
    document.getElementById('closeDetail').addEventListener('click', closeDetailModal);
    
    document.getElementById('uploadModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeUploadModal();
    });
    
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailModal();
    });
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect(files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });
    
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            target.select();
            document.execCommand('copy');
            showToast('已复制到剪贴板');
        });
    });
}

function handleFileSelect(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('不支持的文件类型');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('文件大小不能超过5MB');
        return;
    }
    
    selectedFile = file;
    
    const preview = document.getElementById('filePreview');
    const prompt = document.getElementById('uploadPrompt');
    const img = preview.querySelector('img');
    const name = preview.querySelector('p');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
        name.textContent = file.name;
        preview.classList.remove('hidden');
        prompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedFile) {
        showToast('请选择文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    const categoryId = document.getElementById('uploadCategory').value;
    if (categoryId) formData.append('categoryId', categoryId);
    
    const submitBtn = document.getElementById('submitBtn');
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    submitBtn.disabled = true;
    progress.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = '上传中... ' + percent + '%';
            }
        });
        
        const result = await new Promise((resolve, reject) => {
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (err) {
                    reject(err);
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            
            xhr.open('POST', API_BASE + '/api/upload');
            xhr.send(formData);
        });
        
        if (result.code === 201) {
            showToast('上传成功');
            closeUploadModal();
            currentPage = 1;
            loadImages();
        } else {
            showToast(result.message || '上传失败');
        }
    } catch (err) {
        console.error('Upload error:', err);
        showToast('上传失败，请重试');
    } finally {
        submitBtn.disabled = false;
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.add('hidden');
    document.body.style.overflow = '';
    resetUploadForm();
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function resetUploadForm() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('uploadPrompt').classList.remove('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
