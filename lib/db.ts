import { MongoClient, ObjectId } from "mongodb"
import type { GuidePostData, GuideData } from "@/lib/types"
import fs from "fs/promises"
import path from "path"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
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

// 验证并保存攻略数据
export async function saveGuide(data: GuidePostData): Promise<string> {
  // 验证数据
  validateGuideData(data)

  // 生成唯一ID
  const guideId = new ObjectId().toString()
  const db = (await clientPromise).db("gbf")
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
      charas: data.charas,
      weapons: data.weapons,
      summons: data.summons,
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
} = {}) {
  const db = (await clientPromise).db("gbf")
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
  const db = (await clientPromise).db("gbf")
  return db.collection("guides").findOne({ id })
}

// 删除攻略
export async function deleteGuide(id: string) {
  const db = (await clientPromise).db("gbf")
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
