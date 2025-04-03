import type { GuidePostData, GuideData, EquipmentFilterCondition } from "./types"

// 设置远程服务器URL
const API_BASE_URL = process.env.REMOTE_API_URL
const API_KEY = process.env.REMOTE_API_KEY

// 构建请求头
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY || '', // 添加API Key到请求头
  };
  return headers;
};

// 保存配置数据
export async function saveGuide(data: GuidePostData): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/guides`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(errorData || '保存配置失败')
    }

    const result = await response.text()
    console.log(result)
    return JSON.parse(result).id
  } catch (error) {
    console.error('保存配置失败:', error)
    console.log(data)
    throw error
  }
}

// 获取配置列表
export async function getGuides(query: {
  quest?: string
  tags?: string[]
  timeRange?: [number, number]
  turnRange?: [number, number]
  contributionRange?: [number, number]
  dateRange?: [Date, Date]
  sort?: { field: "time" | "date" | "turn" | "contribution"; direction: "asc" | "desc" }
  charaConditions?: EquipmentFilterCondition[]
  weaponConditions?: EquipmentFilterCondition[]
  summonConditions?: EquipmentFilterCondition[]
} = {}) {
  try {
    // 将复杂查询转换为JSON字符串并编码为URL参数
    const queryParams = new URLSearchParams()
    
    if (Object.keys(query).length > 0) {
      // 处理日期范围转换为ISO字符串
      const formattedQuery = { ...query }
      if (query.dateRange) {
        formattedQuery.dateRange = [
          query.dateRange[0].toISOString(),
          query.dateRange[1].toISOString()
        ] as any
      }
      
      queryParams.append('query', JSON.stringify(formattedQuery))
    }
    
    // 构建URL
    const url = `${API_BASE_URL}/guides${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '获取配置列表失败')
    }

    return await response.json()
  } catch (error) {
    console.error('获取配置列表失败:', error)
    throw error
  }
}

// 获取单个配置
export async function getGuide(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/guides/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '获取配置失败')
    }

    return await response.json()
  } catch (error) {
    console.error('获取配置失败:', error)
    throw error
  }
}

// 删除配置
export async function deleteGuide(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/guides/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '删除配置失败')
    }

    return true
  } catch (error) {
    console.error('删除配置失败:', error)
    throw error
  }
} 