import { NextResponse } from "next/server"
import { mockEquipment, filterOptions, elementNames, categoryNames } from "@/lib/mock-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const searchTerm = searchParams.get("search") || ""
  const elementFilter = searchParams.get("element") || "all"
  const categoryFilter = searchParams.get("category") || "all"

  if (!type || !["summon", "chara", "weapon"].includes(type)) {
    return NextResponse.json({ error: "Invalid equipment type" }, { status: 400 })
  }

  let filtered = [...mockEquipment[type as keyof typeof mockEquipment]]

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Apply element filter
  if (elementFilter !== "all") {
    filtered = filtered.filter((item) => item.element === elementFilter)
  }

  // Apply category filter
  if (categoryFilter !== "all") {
    filtered = filtered.filter((item) => item.category === categoryFilter)
  }

  return NextResponse.json({
    equipment: filtered,
    filterOptions: filterOptions[type as keyof typeof filterOptions],
    elementNames,
    categoryNames,
  })
} 