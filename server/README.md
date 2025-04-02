# 配置服务API服务器

这是配置服务的API服务器，它提供了基本的HTTP端点，用于管理配置数据。

## 功能特性

- 保存配置数据和图片
- 获取配置列表（支持复杂筛选条件）
- 获取单个配置详情
- 删除配置

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

### 获取配置列表

```
GET /api/guides
```

查询参数：
- `query`: JSON字符串，包含筛选条件

### 获取单个配置

```
GET /api/guides/:id
```

### 保存配置

```
POST /api/guides
```

请求体：配置数据（包括角色、武器和召唤石的Base64图片）

### 删除配置

```
DELETE /api/guides/:id
```

## 客户端集成

客户端可以通过设置 `REMOTE_API_URL` 环境变量指向该服务器的地址。 

## API Key验证

系统使用API Key进行API访问验证。请按照以下步骤配置:

### 服务器端配置

在`server/.env`文件中添加以下配置:

```
API_KEY=your-secret-api-key-here
```

将`your-secret-api-key-here`替换为您自定义的复杂密钥。

### 客户端配置

在项目根目录的`.env.local`文件中添加以下配置:

```
REMOTE_API_KEY=your-secret-api-key-here
```

确保服务器端和客户端使用相同的API Key值。

### 测试API Key验证

可以使用curl命令测试API Key验证:

```bash
# 不带API Key的请求（应返回401错误）
curl http://localhost:3001/api/guides

# 带有API Key的请求
curl -H "X-API-Key: your-secret-api-key-here" http://localhost:3001/api/guides
``` 