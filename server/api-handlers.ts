import { Router, Request, Response } from 'express'
import * as dbOperations from '../lib/db'
import type { GuidePostData, EquipmentFilterCondition } from '@/lib/types'

// 创建路由器
export const guidesRouter = Router()

// 类型定义，用于解析请求
interface GetGuidesQuery {
  quest?: string
  tags?: string[]
  timeRange?: [number, number]
  dateRange?: [string, string] // ISO格式的字符串
  sort?: { field: "time" | "date"; direction: "asc" | "desc" }
  charaConditions?: EquipmentFilterCondition[]
  weaponConditions?: EquipmentFilterCondition[]
  summonConditions?: EquipmentFilterCondition[]
}

// 获取攻略列表
guidesRouter.get('/', async (req: Request, res: Response) => {
  try {
    let query: GetGuidesQuery = {}
    
    // 从URL参数中获取查询数据
    if (req.query.query) {
      try {
        query = JSON.parse(req.query.query as string) as GetGuidesQuery
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: '查询参数格式错误' 
        })
      }
    }
    
    // 转换日期字符串为Date对象
    const formattedQuery: any = { ...query }
    if (query.dateRange) {
      formattedQuery.dateRange = [
        new Date(query.dateRange[0]),
        new Date(query.dateRange[1])
      ]
    }
    
    const guides = await dbOperations.getGuides(formattedQuery)
    res.status(200).json(guides)
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取攻略列表失败'
    res.status(500).json({ success: false, message })
  }
})

// 获取单个攻略
guidesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const guide = await dbOperations.getGuide(id)
    
    if (!guide) {
      return res.status(404).json({ success: false, message: '攻略不存在' })
    }
    
    res.status(200).json(guide)
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取攻略失败'
    res.status(500).json({ success: false, message })
  }
})

// 保存攻略
guidesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const guideData = req.body as GuidePostData
    const guideId = await dbOperations.saveGuide(guideData)
    
    res.status(201).json({ success: true, id: guideId })
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存攻略失败'
    res.status(500).json({ success: false, message })
  }
})

// 删除攻略
guidesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await dbOperations.deleteGuide(id)
    
    res.status(200).json({ success: true, message: '攻略已删除' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除攻略失败'
    res.status(500).json({ success: false, message })
  }
}) 