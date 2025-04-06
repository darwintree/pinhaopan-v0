import { NextResponse } from "next/server"
import { getGuides } from "@/lib/remote-db"
import type { GuideQueryParams } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const quest = searchParams.get("quest") || ""
  const tags = searchParams.getAll("tags")
  const timeRange = searchParams.get("timeRange")?.split(",").map(Number) || []
  const dateRange = searchParams.get("dateRange")?.split(",") || []
  const sortField = searchParams.get("sortField") || "date"
  const sortDirection = searchParams.get("sortDirection") || "desc"

  let parsedTimeRange: [number, number] | undefined

  if (timeRange.length == 2) {
    parsedTimeRange = [
      timeRange[0], timeRange[1]
    ]
  }

  // 准备日期范围
  let parsedDateRange: [Date, Date] | undefined
  if (dateRange.length === 2) {
    parsedDateRange = [new Date(dateRange[0]), new Date(dateRange[1])]
  }

  // 处理装备条件
  let weaponConditions, summonConditions, charaConditions
  try {
    weaponConditions = searchParams.get("weaponConditions") ? 
      JSON.parse(searchParams.get("weaponConditions")!) : undefined
    summonConditions = searchParams.get("summonConditions") ? 
      JSON.parse(searchParams.get("summonConditions")!) : undefined
    charaConditions = searchParams.get("charaConditions") ? 
      JSON.parse(searchParams.get("charaConditions")!) : undefined
  } catch (error) {
    console.error("Failed to parse equipment conditions:", error)
    return NextResponse.json(
      { error: "Invalid equipment conditions format" },
      { status: 400 }
    )
  }

  // 构建查询参数
  const queryParams: GuideQueryParams = {
    quest: quest || undefined,
    tags: tags.length > 0 ? tags : undefined,
    timeRange: parsedTimeRange,
    dateRange: parsedDateRange,
    sort: {
      field: (sortField === "time" || sortField === "date") ? sortField : "date",
      direction: (sortDirection === "asc" || sortDirection === "desc") ? sortDirection : "desc"
    },
    weaponConditions,
    summonConditions,
    charaConditions
  }

  // 使用 db 接口获取数据
  const guides = await getGuides(queryParams)

  return NextResponse.json({
    guides,
  })
} 