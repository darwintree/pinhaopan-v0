# 攻略服务API服务器

这是攻略服务的API服务器，它提供了基本的HTTP端点，用于管理攻略数据。

## 功能特性

- 保存攻略数据和图片
- 获取攻略列表（支持复杂筛选条件）
- 获取单个攻略详情
- 删除攻略

## 环境要求

- Node.js 14.x 或更高版本
- MongoDB 服务器

## 环境变量

服务器需要以下环境变量：

- `MONGODB_URI`: MongoDB 连接字符串
- `MONGODB_DB`: MongoDB 数据库名称
- `LOCAL_STORAGE_PATH`: 本地存储路径（用于保存图片）
- `SERVER_PORT`: （可选）服务器端口，默认为 3001

## 安装

```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

## 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run start
```

## API 端点

### 获取攻略列表

```
GET /api/guides
```

查询参数：
- `query`: JSON字符串，包含筛选条件

### 获取单个攻略

```
GET /api/guides/:id
```

### 保存攻略

```
POST /api/guides
```

请求体：攻略数据（包括角色、武器和召唤石的Base64图片）

### 删除攻略

```
DELETE /api/guides/:id
```

## 客户端集成

客户端可以通过设置 `REMOTE_API_URL` 环境变量指向该服务器的地址。 