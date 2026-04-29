CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'admin' COMMENT 'super_admin, admin, editor',
    status TINYINT DEFAULT 1 COMMENT '1: active, 0: disabled',
    last_login DATETIME DEFAULT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    admin_id INT DEFAULT NULL,
    admin_name VARCHAR(50) DEFAULT NULL,
    ip VARCHAR(50) DEFAULT NULL,
    details TEXT DEFAULT NULL,
    status TINYINT DEFAULT 1 COMMENT '1: success, 0: failed',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin (admin_id),
    INDEX idx_action (action),
    INDEX idx_create_time (create_time)
);

CREATE TABLE IF NOT EXISTS tag_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(50) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    priority INT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL,
    task_type VARCHAR(50) NOT NULL COMMENT 'auto_categorize, generate_alt',
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, processing, completed, failed',
    result TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    retry_count INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_image (image_id)
);

-- 初始数据 - 默认管理员账号: admin / admin123
INSERT INTO admins (username, password, email, role) VALUES 
('admin', '$2b$10$eYcNkBHu0WvJ3K4sch0Zj.8dmIuoz9I3gNPwSwSktJ.k0kSnM1Iey', 'admin@memehub.com', 'super_admin');

INSERT INTO settings (key, value, description) VALUES
('max_upload_size', '5', '最大上传文件大小（MB）'),
('allowed_formats', 'jpg,png,gif,webp', '允许的图片格式'),
('auto_categorize', '0', '是否开启自动分类'),
('enable_register', '0', '是否开启用户注册'),
('thumbnail_width', '300', '缩略图宽度'),
('thumbnail_height', '300', '缩略图高度'),
('site_name', 'MemeHub', '网站名称'),
('site_description', '高性能图片托管平台', '网站描述');

INSERT INTO tag_rules (tag, category_id, priority) VALUES
('cat', 1, 10),
('dog', 1, 10),
('animal', 1, 5),
('anime', 2, 10),
('manga', 2, 8),
('game', 3, 10),
('meme', 4, 10),
('funny', 4, 5),
('cute', 7, 5),
('pet', 7, 8);
