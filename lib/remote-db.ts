import type { GuidePostData, GuideData, EquipmentFilterCondition } from "@/lib/types"

// 设置远程服务器URL
const API_BASE_URL = process.env.REMOTE_API_URL || 'http://localhost:3001/api'

// 保存攻略数据
export async function saveGuide(data: GuidePostData): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/guides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '保存攻略失败')
    }

    const result = await response.json()
    return result.id
  } catch (error) {
    console.error('保存攻略失败:', error)
    throw error
  }
}

// 获取攻略列表
export async function getGuides(query: {
  quest?: string
  tags?: string[]
  timeRange?: [number, number]
  dateRange?: [Date, Date]
  sort?: { field: "time" | "date"; direction: "asc" | "desc" }
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
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '获取攻略列表失败')
    }

    return await response.json()
  } catch (error) {
    console.error('获取攻略列表失败:', error)
    throw error
  }
}

// 获取单个攻略
export async function getGuide(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/guides/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '获取攻略失败')
    }

    return await response.json()
  } catch (error) {
    console.error('获取攻略失败:', error)
    throw error
  }
}

// 删除攻略
export async function deleteGuide(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/guides/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '删除攻略失败')
    }

    return true
  } catch (error) {
    console.error('删除攻略失败:', error)
    throw error
  }
} 