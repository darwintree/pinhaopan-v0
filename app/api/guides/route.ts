import { NextResponse } from "next/server"
import type { GuideData, EquipmentFilterCondition } from "@/lib/types"
import { availableTags, availableWeapons, availableSummons, availableCharas } from "@/lib/mock-data"
import { getGuides } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const quest = searchParams.get("quest") || ""
  const tags = searchParams.getAll("tags")
  const timeRange = searchParams.get("timeRange")?.split(",").map(Number) || [0, 30]
  const dateRange = searchParams.get("dateRange")?.split(",") || []
  const sortField = searchParams.get("sortField") || "date"
  const sortDirection = searchParams.get("sortDirection") || "desc"

  // 准备日期范围
  let parsedDateRange: [Date, Date] | undefined
  if (dateRange.length === 2) {
    parsedDateRange = [new Date(dateRange[0]), new Date(dateRange[1])]
  }

  // 使用 db 接口获取数据
  const guides = await getGuides({
    quest: quest || undefined,
    tags: tags.length > 0 ? tags : undefined,
    timeRange: [timeRange[0], timeRange[1]],
    dateRange: parsedDateRange,
    sort: {
      field: (sortField === "time" || sortField === "date") ? sortField : "date",
      direction: (sortDirection === "asc" || sortDirection === "desc") ? sortDirection : "desc"
    }
  })

  // 暂时保留武器、召唤石和角色的过滤功能的接口，但实际不实现过滤
  // 后续可以在 db 层实现这些过滤功能

  return NextResponse.json({
    guides,
    availableTags,
    availableWeapons,
    availableSummons,
    availableCharas,
  })
} 