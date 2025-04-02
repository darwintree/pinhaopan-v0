import { Request, Response, NextFunction } from 'express';

/**
 * API Key验证中间件
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // 从请求头获取API Key
  const apiKey = req.headers['x-api-key'];

  // 获取环境变量中的API Key
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.error('API_KEY环境变量未配置');
    return res.status(500).json({ 
      success: false, 
      message: '服务器配置错误: API Key未配置' 
    });
  }
  
  // 验证API Key
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ 
      success: false, 
      message: '未授权: 无效的API Key' 
    });
  }

  // 验证通过，继续下一步
  next();
}; 