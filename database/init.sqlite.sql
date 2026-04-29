-- SQLite 建表脚本
-- 使用方法: 服务器启动时会自动初始化

-- Categories 表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  updated_at TIMESTAMP DEFAULT (datetime('now'))
);

-- Images 表
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  category_id INTEGER,
  file_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  upload_time TIMESTAMP DEFAULT (datetime('now')),
  updated_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Admins 表
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT DEFAULT NULL,
  role TEXT DEFAULT 'admin',
  status INTEGER DEFAULT 1,
  last_login TIMESTAMP DEFAULT NULL,
  create_time TIMESTAMP DEFAULT (datetime('now')),
  update_time TIMESTAMP DEFAULT (datetime('now'))
);

-- Settings 表
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  update_time TIMESTAMP DEFAULT (datetime('now'))
);

-- Logs 表
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  admin_id INTEGER DEFAULT NULL,
  admin_name TEXT DEFAULT NULL,
  ip TEXT DEFAULT NULL,
  details TEXT DEFAULT NULL,
  status INTEGER DEFAULT 1,
  create_time TIMESTAMP DEFAULT (datetime('now'))
);

-- Tag Rules 表
CREATE TABLE IF NOT EXISTS tag_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL UNIQUE,
  category_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  create_time TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_upload_time ON images(upload_time);
CREATE INDEX IF NOT EXISTS idx_images_views ON images(views);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_images_original_name ON images(original_name);
CREATE INDEX IF NOT EXISTS idx_logs_admin ON logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_create_time ON logs(create_time);

-- 插入默认分类
INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES
('搞笑表情', 'funny', '搞笑幽默表情包', 1),
('动漫表情', 'anime', '动漫相关表情包', 2),
('游戏表情', 'game', '游戏相关表情包', 3),
('斗图表情', 'battle', '斗图专用表情包', 4),
('可爱萌宠', 'pet', '可爱宠物表情包', 5),
('影视经典', 'movie', '影视剧经典表情包', 6),
('日常沙雕', 'silly', '日常沙雕表情包', 7),
('其他', 'other', '其他类型表情包', 99);

-- 插入默认管理员 (用户名: admin, 密码: admin123)
INSERT OR IGNORE INTO admins (username, password, email, role) VALUES 
('admin', '$2b$10$eYcNkBHu0WvJ3K4sch0Zj.8dmIuoz9I3gNPwSwSktJ.k0kSnM1Iey', 'admin@memehub.com', 'super_admin');

-- 插入默认设置
INSERT OR IGNORE INTO settings (key, value, description) VALUES
('max_upload_size', '5', '最大上传文件大小（MB）'),
('allowed_formats', 'jpg,png,gif,webp', '允许的图片格式'),
('auto_categorize', '0', '是否开启自动分类'),
('enable_register', '0', '是否开启用户注册'),
('thumbnail_width', '300', '缩略图宽度'),
('thumbnail_height', '300', '缩略图高度'),
('site_name', 'MemeHub', '网站名称'),
('site_description', '高性能图片托管平台', '网站描述');

-- 插入默认标签规则
INSERT OR IGNORE INTO tag_rules (tag, category_id, priority) VALUES
('cat', 5, 10),
('dog', 5, 10),
('animal', 5, 5),
('anime', 2, 10),
('manga', 2, 8),
('game', 3, 10),
('meme', 1, 10),
('funny', 1, 5),
('cute', 5, 5),
('pet', 5, 8);

-- 更新分类图片计数
CREATE TRIGGER IF NOT EXISTS after_image_insert
AFTER INSERT ON images
FOR EACH ROW
BEGIN
  UPDATE categories SET image_count = image_count + 1 WHERE id = NEW.category_id;
END;

CREATE TRIGGER IF NOT EXISTS after_image_delete
AFTER DELETE ON images
FOR EACH ROW
BEGIN
  UPDATE categories SET image_count = image_count - 1 WHERE id = OLD.category_id;
END;
