# MemeHub API 文档

## 概述

MemeHub 是一个图片托管平台，提供完整的 RESTful API 接口用于图片上传、管理、分类和浏览。

- **基础URL**: `http://localhost:3000`
- **数据格式**: JSON
- **认证方式**: Bearer Token (JWT)

---

## 通用规范

### 响应格式

所有 API 返回统一的 JSON 格式：

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误码体系

| 错误码 | 说明 |
|--------|------|
| 400001 | 缺少必填字段 |
| 400002 | 字段长度无效 |
| 400003 | 字段格式无效 |
| 400005 | 数组格式无效 |
| 400007 | 文件过大 |
| 400008 | 未上传文件 |
| 401001 | 需要认证 |
| 401003 | Token已过期 |
| 401004 | Token无效 |
| 403001 | 权限不足 |
| 404001 | 资源不存在 |
| 404002 | 分类不存在 |
| 404003 | 图片不存在 |
| 409001 | 资源已存在 |
| 409002 | 分类包含图片，无法删除 |
| 429001 | 请求过于频繁 |
| 500001 | 服务器内部错误 |

---

## 认证接口

### 登录

获取管理员访问令牌。

```
POST /api/admin/login
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@memehub.com",
      "role": "super_admin"
    }
  }
}
```

### 退出登录

```
POST /api/admin/logout
```

**请求头：**

```
Authorization: Bearer <token>
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Logout successful",
  "data": null
}
```

### 获取当前用户信息

```
GET /api/admin/me
```

**请求头：**

```
Authorization: Bearer <token>
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@memehub.com",
    "role": "super_admin",
    "status": 1,
    "last_login": "2026-04-30T10:00:00.000Z",
    "create_time": "2026-04-01T00:00:00.000Z"
  }
}
```

---

## 分类管理接口

### 获取分类列表

获取所有图片分类（公开接口，无需认证）。

```
GET /api/categories
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "搞笑表情",
      "slug": "funny",
      "description": "搞笑表情包合集",
      "imageCount": 150,
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "动漫表情",
      "slug": "anime",
      "description": "二次元表情包",
      "imageCount": 89,
      "sortOrder": 2
    }
  ]
}
```

### 获取分类详情

```
GET /api/categories/:id
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 分类ID |

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "搞笑表情",
    "slug": "funny",
    "description": "搞笑表情包合集",
    "imageCount": 150,
    "sortOrder": 1
  }
}
```

### 创建分类

**需要认证：** 管理员权限

```
POST /api/categories
```

**请求头：**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 (1-50字符) |
| slug | string | 是 | URL标识符 (小写字母、数字、连字符) |
| description | string | 否 | 分类描述 |
| sortOrder | integer | 否 | 排序顺序，默认0 |

**请求示例：**

```json
{
  "name": "游戏表情",
  "slug": "gaming",
  "description": "游戏相关表情包",
  "sortOrder": 3
}
```

**响应示例：**

```json
{
  "code": 201,
  "message": "Category created successfully",
  "data": {
    "id": 3,
    "name": "游戏表情",
    "slug": "gaming",
    "description": "游戏相关表情包",
    "sortOrder": 3
  }
}
```

**错误响应：**

```json
{
  "code": 409001,
  "message": "Conflict: category slug already exists",
  "data": null
}
```

### 更新分类

**需要认证：** 管理员权限

```
PUT /api/categories/:id
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称 |
| slug | string | 否 | URL标识符 |
| description | string | 否 | 分类描述 |
| sortOrder | integer | 否 | 排序顺序 |

**请求示例：**

```json
{
  "name": "游戏表情包",
  "sortOrder": 2
}
```

### 删除分类

**需要认证：** 管理员权限

删除分类前会检查是否包含图片，如果包含则拒绝删除。

```
DELETE /api/categories/:id
```

**响应示例 - 成功：**

```json
{
  "code": 200,
  "message": "Category deleted successfully",
  "data": {
    "id": 3,
    "name": "游戏表情"
  }
}
```

**响应示例 - 分类包含图片：**

```json
{
  "code": 409002,
  "message": "Conflict: category contains 150 images, cannot delete",
  "data": {
    "imageCount": 150
  }
}
```

### 批量删除分类

**需要认证：** 管理员权限

```
POST /api/categories/batch-delete
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 分类ID数组 |

**请求示例：**

```json
{
  "ids": [3, 4, 5]
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Deleted 2 categories successfully",
  "data": {
    "deletedIds": [3, 4],
    "deletedNames": ["游戏表情", "测试分类"],
    "blockedCategories": [
      {
        "id": 5,
        "name": "搞笑表情",
        "imageCount": 150
      }
    ]
  }
}
```

---

## 图片管理接口

### 获取图片列表

获取公开图片列表（公开接口，无需认证）。

```
GET /api/images
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| pageSize | integer | 否 | 每页数量，默认20，最大100 |
| categoryId | integer | 否 | 分类ID筛选 |
| search | string | 否 | 按名称搜索 |
| sortBy | string | 否 | 排序字段：upload_time/views/file_size |
| sortOrder | string | 否 | 排序方向：asc/desc |

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "images": [
      {
        "id": "encrypted_token",
        "filename": "uuid.jpg",
        "originalName": "funny_cat.jpg",
        "categoryId": 1,
        "categoryName": "搞笑表情",
        "fileSize": 204800,
        "width": 800,
        "height": 600,
        "mimeType": "image/jpeg",
        "views": 150,
        "uploadTime": "2026-04-30T10:00:00.000Z",
        "thumbnailUrl": "http://localhost:3000/t/thumb_token",
        "directUrl": "http://localhost:3000/i/image_token.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 获取热门图片

```
GET /api/images/popular
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回数量，默认10，最大20 |

### 获取图片详情

```
GET /api/image/:id
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 加密后的图片ID |

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "encrypted_token",
    "filename": "uuid.jpg",
    "originalName": "funny_cat.jpg",
    "categoryId": 1,
    "categoryName": "搞笑表情",
    "fileSize": 204800,
    "width": 800,
    "height": 600,
    "mimeType": "image/jpeg",
    "views": 150,
    "uploadTime": "2026-04-30T10:00:00.000Z",
    "thumbnailUrl": "http://localhost:3000/t/thumb_token",
    "directUrl": "http://localhost:3000/i/image_token.jpg",
    "urls": {
      "direct": "http://localhost:3000/i/image_token.jpg",
      "markdown": "![funny_cat.jpg](http://localhost:3000/i/image_token.jpg)",
      "html": "<img src=\"http://localhost:3000/i/image_token.jpg\" alt=\"funny_cat.jpg\">",
      "bbcode": "[img]http://localhost:3000/i/image_token.jpg[/img]"
    }
  }
}
```

### 上传图片

**需要认证：** 管理员权限

支持多图上传，自动验证格式、生成缩略图。

```
POST /api/upload
```

**请求头：**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| files | File | 是 | 图片文件，支持多选 |
| categoryId | integer | 否 | 分类ID |

**支持格式：** JPG, PNG, GIF, WEBP

**大小限制：** 单文件最大 5MB

**响应示例：**

```json
{
  "code": 201,
  "message": "Uploaded 2 file(s) successfully",
  "data": {
    "uploadedCount": 2,
    "files": [
      {
        "id": "uuid-1",
        "filename": "uuid-1.jpg",
        "originalName": "cat.jpg",
        "thumbnailFilename": "uuid-1_thumb.jpg",
        "width": 800,
        "height": 600,
        "fileSize": 204800,
        "mimeType": "image/jpeg",
        "urls": {
          "direct": "http://localhost:3000/uploads/uuid-1.jpg",
          "thumbnail": "http://localhost:3000/thumbnails/uuid-1_thumb.jpg",
          "markdown": "![cat.jpg](http://localhost:3000/uploads/uuid-1.jpg)",
          "html": "<img src=\"http://localhost:3000/uploads/uuid-1.jpg\" alt=\"cat.jpg\">"
        }
      }
    ]
  }
}
```

### 删除图片

**需要认证：** 管理员权限

删除图片时会同步清理上传文件和缩略图文件。

```
DELETE /api/image/:id
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 加密后的图片ID |

**响应示例：**

```json
{
  "code": 200,
  "message": "Image deleted successfully",
  "data": {
    "id": "original_uuid",
    "filename": "uuid.jpg"
  }
}
```

### 批量删除图片

**需要认证：** 管理员权限

```
POST /api/images/batch-delete
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 加密图片ID数组 |

**请求示例：**

```json
{
  "ids": ["token1", "token2", "token3"]
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Deleted 2 images successfully",
  "data": {
    "deletedCount": 2,
    "deletedFiles": [
      {
        "id": "uuid-1",
        "filename": "uuid-1.jpg"
      },
      {
        "id": "uuid-2",
        "filename": "uuid-2.png"
      }
    ],
    "failedCount": 0,
    "failedDeletions": [],
    "invalidIds": []
  }
}
```

### 修改图片分类

**需要认证：** 管理员权限

```
PUT /api/image/:id/category
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| categoryId | integer | 是 | 新分类ID，0表示取消分类 |

**请求示例：**

```json
{
  "categoryId": 2
}
```

---

## 管理员接口

### 仪表盘数据

**需要认证：** 管理员权限

```
GET /api/admin/dashboard
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "stats": {
      "imageCount": 150,
      "todayCount": 5,
      "categoryCount": 8
    },
    "recentImages": [...],
    "systemStatus": {
      "uptime": 3600,
      "memoryUsage": {
        "rss": 128,
        "heapUsed": 64,
        "heapTotal": 128
      },
      "nodeVersion": "v20.0.0"
    },
    "trendData": [
      { "date": "2026-04-24", "count": 10 },
      { "date": "2026-04-25", "count": 15 }
    ],
    "categoryStats": [
      { "name": "搞笑表情", "count": 80 },
      { "name": "动漫表情", "count": 45 }
    ]
  }
}
```

### 心跳检测

**需要认证：** 管理员权限

轻量级数据接口，用于前端定时刷新。

```
GET /api/admin/heartbeat
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "stats": {
      "imageCount": 150,
      "todayCount": 5,
      "categoryCount": 8
    },
    "trendData": [...],
    "categoryStats": [...],
    "recentImages": [...],
    "timestamp": 1777480000000
  }
}
```

---

## 系统接口

### 健康检查

```
GET /health
```

**响应示例：**

```json
{
  "status": "ok",
  "timestamp": "2026-04-30T10:00:00.000Z"
}
```

---

## 文件访问

### 访问原图

```
GET /i/:id
```

直接返回图片文件流，支持浏览器缓存。

### 访问缩略图

```
GET /t/:id
```

返回缩略图文件流，缓存24小时。

---

## 限流规则

| 接口 | 限制 |
|------|------|
| POST /api/upload | 每分钟10次/IP |

---

## 缓存策略

| 数据类型 | 缓存时间 |
|----------|----------|
| 图片列表 | 5分钟 |
| 图片详情 | 1小时 |
| 分类列表 | 1小时 |
| 热门图片 | 5分钟 |

数据变更后缓存会自动失效。
