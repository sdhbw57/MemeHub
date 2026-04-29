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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_upload_time ON images(upload_time);
CREATE INDEX IF NOT EXISTS idx_images_views ON images(views);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_images_original_name ON images(original_name);

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
