-- Create database
CREATE DATABASE IF NOT EXISTS image_hosting DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE image_hosting;

-- Categories table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Category name',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL-friendly slug',
  `description` VARCHAR(255) DEFAULT '' COMMENT 'Category description',
  `sort_order` INT UNSIGNED DEFAULT 0 COMMENT 'Display order',
  `image_count` INT UNSIGNED DEFAULT 0 COMMENT 'Total images count',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Image categories';

-- Images table
CREATE TABLE IF NOT EXISTS `images` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  `filename` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Stored filename',
  `original_name` VARCHAR(255) NOT NULL COMMENT 'Original upload name',
  `category_id` INT UNSIGNED DEFAULT NULL COMMENT 'Category foreign key',
  `file_size` BIGINT UNSIGNED NOT NULL COMMENT 'File size in bytes',
  `width` INT UNSIGNED NOT NULL COMMENT 'Image width',
  `height` INT UNSIGNED NOT NULL COMMENT 'Image height',
  `mime_type` VARCHAR(50) NOT NULL COMMENT 'MIME type',
  `extension` VARCHAR(10) NOT NULL COMMENT 'File extension',
  `views` INT UNSIGNED DEFAULT 0 COMMENT 'View count',
  `upload_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Upload time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_upload_time` (`upload_time`),
  INDEX `idx_views` (`views`),
  INDEX `idx_original_name` (`original_name`(100)),
  CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Image records';

-- Insert default categories
INSERT IGNORE INTO `categories` (`name`, `slug`, `description`, `sort_order`) VALUES
('搞笑表情', 'funny', '搞笑幽默表情包', 1),
('动漫表情', 'anime', '动漫相关表情包', 2),
('游戏表情', 'game', '游戏相关表情包', 3),
('斗图表情', 'battle', '斗图专用表情包', 4),
('可爱萌宠', 'pet', '可爱宠物表情包', 5),
('影视经典', 'movie', '影视剧经典表情包', 6),
('日常沙雕', 'silly', '日常沙雕表情包', 7),
('其他', 'other', '其他类型表情包', 99);

-- Create a stored procedure to update category image count
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `update_category_count`(IN cat_id INT)
BEGIN
  UPDATE `categories` 
  SET `image_count` = (SELECT COUNT(*) FROM `images` WHERE `category_id` = cat_id)
  WHERE `id` = cat_id;
END$$
DELIMITER ;
