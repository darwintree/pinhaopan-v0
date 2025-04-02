import { MongoClient, ObjectId } from "mongodb"
import type { GuidePostData, GuideData, EquipmentFilterCondition, EquipmentData } from "@/lib/types"
import fs from "fs/promises"
import path from "path"
import { normalizeEquipmentId } from "./asset"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

if (!process.env.MONGODB_DB) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_DB"')
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB
const storagePath = process.env.LOCAL_STORAGE_PATH
const options = {}

if (!storagePath) {
  throw new Error('Invalid/Missing environment variable: "LOCAL_STORAGE_PATH"')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongoClient?: MongoClient
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClient = client
    globalWithMongo._mongoClientPromise = client.connect()
  }
  client = globalWithMongo._mongoClient!
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// 验证数据
function validateGuideData(data: GuidePostData): void {
  if (!data.quest) {
    throw new Error("缺少必填字段: quest")
  }

  if (!data.charas?.length || !data.charasBase64?.length) {
    throw new Error("缺少必填字段: charas")
  }

  if (!data.weapons?.length || !data.weaponsBase64?.length) {
    throw new Error("缺少必填字段: weapons")
  }

  if (!data.summons?.length || !data.summonsBase64?.length) {
    throw new Error("缺少必填字段: summons")
  }
}

// 保存图片
async function saveBase64Image(base64: string, type: string, id: string): Promise<string> {
  try {
    // 移除 base64 头部
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // 确保存储目录存在
    const storageDir = path.join(process.cwd(), storagePath!, type)
    await fs.mkdir(storageDir, { recursive: true })

    // 生成文件名并保存
    const filename = `${id}_${type}.png`
    const filepath = path.join(storageDir, filename)
    await fs.writeFile(filepath, buffer)

    console.log(`图片保存成功: ${filepath}`)

    return `${storagePath}/${type}/${filename}`
  } catch (error) {
    console.error("图片保存失败:", error)
    throw new Error(`图片保存失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function normalizeEquipments(equipmentsData: EquipmentData[]) {
  return equipmentsData.map(equipment => {
    return {
      ...equipment,
      id: normalizeEquipmentId(equipment.id)
    }
  })
}

// 验证并保存攻略数据
export async function saveGuide(data: GuidePostData): Promise<string> {
  // 验证数据
  validateGuideData(data)

  // 生成唯一ID
  const guideId = new ObjectId().toString()
  const db = (await clientPromise).db(dbName)
  const session = client.startSession()

  try {
    // 保存图片
    // 暂时不保存图片
    const imagePromises = [
      saveBase64Image(data.charasBase64, "charas", guideId),
      saveBase64Image(data.weaponsBase64, "weapons", guideId),
      saveBase64Image(data.summonsBase64, "summons", guideId)
    ]

    await Promise.all(imagePromises)

    // 准备数据库文档
    const guideDoc: GuideData = {
      id: guideId,
      quest: data.quest,
      time: data.time || 5,
      date: Date.now(),
      charas: normalizeEquipments(data.charas),
      weapons: normalizeEquipments(data.weapons),
      summons: normalizeEquipments(data.summons),
      tags: data.tags || [],
      description: data.description || "",
    }

    // 插入数据
    await db.collection("guides").insertOne(guideDoc, { session })
    return guideId
  } catch (error) {
    // 如果事务失败，清理已保存的图片
    const storageDir = path.join(process.cwd(), "storage")
    if (await fs.stat(storageDir).catch(() => null)) {
      const types = ["charas", "weapons", "summons"]
      for (const type of types) {
        const typeDir = path.join(storageDir, type)
        if (await fs.stat(typeDir).catch(() => null)) {
          const files = await fs.readdir(typeDir)
          await Promise.all(
            files
              .filter(file => file.startsWith(guideId))
              .map(file => fs.unlink(path.join(typeDir, file)).catch(() => {}))
          )
        }
      }
    }
    throw error
  } finally {
    await session.endSession()
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
  const db = (await clientPromise).db(dbName)
  const filter: any = {}

  if (query.quest) {
    filter.quest = query.quest
  }

  if (query.tags?.length) {
    filter.tags = { $all: query.tags }
  }

  if (query.timeRange) {
    filter.time = { $gte: query.timeRange[0], $lte: query.timeRange[1] }
  }

  if (query.dateRange) {
    filter.date = { $gte: query.dateRange[0].getTime(), $lte: query.dateRange[1].getTime() }
  }

  // 处理武器筛选条件
  if (query.weaponConditions?.length) {
    const includeConditions = query.weaponConditions.filter(c => c.include)
    const excludeConditions = query.weaponConditions.filter(c => !c.include)
    
    // 处理包含条件 - 使用 $all 和 $elemMatch 优化查询
    if (includeConditions.length) {
      const weaponMatches = includeConditions.map(condition => {
        const weaponMatch: any = {}
        
        if (condition.count <= 1) {
          // 基本武器ID匹配
          const elementMatch: any = {
            "weapons.id": condition.id
          }
          
          // 添加properties筛选
          if (condition.properties) {
            // 处理等级筛选
            if (condition.properties.lv !== undefined) {
              elementMatch["weapons.properties.lv"] = condition.properties.lv
            }
            
            // 处理技能筛选
            if (condition.properties.u1) {
              elementMatch["weapons.properties.u1"] = condition.properties.u1
            }
            if (condition.properties.u2) {
              elementMatch["weapons.properties.u2"] = condition.properties.u2
            }
            if (condition.properties.u3) {
              elementMatch["weapons.properties.u3"] = condition.properties.u3
            }
            
            // 处理路西技能
            if (condition.properties.luci2) {
              elementMatch["weapons.properties.luci2"] = condition.properties.luci2
            }
            if (condition.properties.luci3) {
              elementMatch["weapons.properties.luci3"] = condition.properties.luci3
            }
            
            // 处理觉醒状态
            if (condition.properties.awake) {
              elementMatch["weapons.properties.awake"] = condition.properties.awake
            }
          }
          
          return elementMatch
        } else {
          // 需要多个相同武器时，使用聚合管道
          // 创建匹配条件，包括 properties
          const matchCondition: any = { $eq: ["$$this.id", condition.id] }
          
          // 如果有 properties，添加到匹配条件
          if (condition.properties) {
            if (condition.properties.lv !== undefined) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.lv", condition.properties.lv] })
            }
            
            // 技能匹配
            if (condition.properties.u1) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.u1", condition.properties.u1] })
            }
            if (condition.properties.u2) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.u2", condition.properties.u2] })
            }
            if (condition.properties.u3) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.u3", condition.properties.u3] })
            }
            
            // 路西技能匹配
            if (condition.properties.luci2) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.luci2", condition.properties.luci2] })
            }
            if (condition.properties.luci3) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.luci3", condition.properties.luci3] })
            }
            
            // 觉醒状态匹配
            if (condition.properties.awake) {
              matchCondition.$and = matchCondition.$and || []
              matchCondition.$and.push({ $eq: ["$$this.properties.awake", condition.properties.awake] })
            }
          }
          
          return {
            $expr: {
              $gte: [
                { $size: { $filter: {
                  input: "$weapons",
                  cond: matchCondition
                }}},
                condition.count
              ]
            }
          }
        }
      })
      
      // 如果有多个包含条件，使用 $and 连接
      if (weaponMatches.length > 1) {
        filter.$and = filter.$and || []
        filter.$and.push(...weaponMatches)
      } else if (weaponMatches.length === 1) {
        Object.assign(filter, weaponMatches[0])
      }
    }
    
    // 处理排除条件
    if (excludeConditions.length) {
      filter.$and = filter.$and || []
      
      // 为每个排除条件创建一个 $not 匹配
      excludeConditions.forEach(condition => {
        const excludeMatch: any = { $not: { $elemMatch: { id: condition.id } } }
        
        // 考虑 properties（如果指定了properties，则只排除具有特定properties的武器）
        if (condition.properties && Object.keys(condition.properties).length > 0) {
          excludeMatch.$not.$elemMatch = { id: condition.id }
          
          if (condition.properties.lv !== undefined) {
            excludeMatch.$not.$elemMatch["properties.lv"] = condition.properties.lv
          }
          if (condition.properties.u1) {
            excludeMatch.$not.$elemMatch["properties.u1"] = condition.properties.u1
          }
          if (condition.properties.u2) {
            excludeMatch.$not.$elemMatch["properties.u2"] = condition.properties.u2
          }
          if (condition.properties.u3) {
            excludeMatch.$not.$elemMatch["properties.u3"] = condition.properties.u3
          }
          if (condition.properties.luci2) {
            excludeMatch.$not.$elemMatch["properties.luci2"] = condition.properties.luci2
          }
          if (condition.properties.luci3) {
            excludeMatch.$not.$elemMatch["properties.luci3"] = condition.properties.luci3
          }
          if (condition.properties.awake) {
            excludeMatch.$not.$elemMatch["properties.awake"] = condition.properties.awake
          }
        }
        
        filter.$and.push({ weapons: excludeMatch })
      })
    }
  }

  const sort: any = {}
  if (query.sort) {
    sort[query.sort.field] = query.sort.direction === "asc" ? 1 : -1
  } else {
    sort.date = -1
  }

  return db.collection("guides").find(filter).sort(sort).toArray()
}

// 获取单个攻略
export async function getGuide(id: string) {
  const db = (await clientPromise).db(dbName)
  return db.collection("guides").findOne({ id })
}

// 删除攻略
export async function deleteGuide(id: string) {
  const db = (await clientPromise).db(dbName)
  const session = client.startSession()

  try {
    await session.withTransaction(async () => {
      // 获取攻略数据
      const guide = await db.collection("guides").findOne({ id }, { session })
      if (!guide) {
        throw new Error("攻略不存在")
      }

      // 删除数据库记录
      await db.collection("guides").deleteOne({ id }, { session })

      // 删除图片文件
      const storageDir = path.join(process.cwd(), "storage")
      const types = ["charas", "weapons", "summons"]
      for (const type of types) {
        const typeDir = path.join(storageDir, type)
        if (await fs.stat(typeDir).catch(() => null)) {
          const files = await fs.readdir(typeDir)
          await Promise.all(
            files
              .filter(file => file.startsWith(id))
              .map(file => fs.unlink(path.join(typeDir, file)).catch(() => {}))
          )
        }
      }
    })
  } finally {
    await session.endSession()
  }
}

// Export the clientPromise for use in other files
export { clientPromise }
