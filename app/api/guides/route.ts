import { NextResponse } from "next/server"
import { mockGuides, availableTags, availableWeapons, availableSummons } from "@/lib/mock-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const searchTerm = searchParams.get("search") || ""
  const tags = searchParams.getAll("tags")
  const timeRange = searchParams.get("timeRange")?.split(",").map(Number) || [0, 30]
  const dateRange = searchParams.get("dateRange")?.split(",") || []
  const weaponConditions = JSON.parse(searchParams.get("weaponConditions") || "[]")
  const summonConditions = JSON.parse(searchParams.get("summonConditions") || "[]")
  const sortField = searchParams.get("sortField") || "date"
  const sortDirection = searchParams.get("sortDirection") || "desc"

  let filtered = [...mockGuides]

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter((guide) => 
      guide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Apply tags filter
  if (tags.length > 0) {
    filtered = filtered.filter((guide) => 
      tags.every(tag => guide.tags.includes(tag))
    )
  }

  // Apply time range filter
  filtered = filtered.filter((guide) => 
    guide.time >= timeRange[0] && guide.time <= timeRange[1]
  )

  // Apply date range filter
  if (dateRange.length === 2) {
    const [from, to] = dateRange
    filtered = filtered.filter((guide) => {
      const guideDate = new Date(guide.date)
      return (!from || guideDate >= new Date(from)) && (!to || guideDate <= new Date(to))
    })
  }

  // Apply weapon conditions
  if (weaponConditions.length > 0) {
    filtered = filtered.filter((guide) => {
      return weaponConditions.every((condition: any) => {
        const count = guide.weapons.filter(w => w === condition.weapon).length
        if (condition.type === "include") {
          return count >= condition.count
        } else {
          return count === 0
        }
      })
    })
  }

  // Apply summon conditions
  if (summonConditions.length > 0) {
    filtered = filtered.filter((guide) => {
      return summonConditions.every((condition: any) => {
        const hasSummon = guide.summons.includes(condition.summon)
        return condition.type === "include" ? hasSummon : !hasSummon
      })
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    if (sortField === "time") {
      return sortDirection === "asc" ? a.time - b.time : b.time - a.time
    } else {
      return sortDirection === "asc" 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  return NextResponse.json({
    guides: filtered,
    availableTags,
    availableWeapons,
    availableSummons,
  })
} 