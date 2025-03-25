import { NextResponse } from "next/server"
import { mockRecognitionResults } from "@/lib/mock-data"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, rectangles } = body

    if (!type || !rectangles) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 返回mock识别结果
    const results = mockRecognitionResults[type as keyof typeof mockRecognitionResults]
    if (!results) {
      return NextResponse.json(
        { error: "Invalid equipment type" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      results: results.positions,
    })
  } catch (error) {
    console.error("Recognition error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 