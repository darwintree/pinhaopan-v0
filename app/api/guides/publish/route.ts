import { NextResponse } from "next/server"
import type { GuidePostData } from "@/lib/types"
import { saveGuide } from "@/lib/remote-db"

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json()
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      )
    }

    try {
      const guideId = await saveGuide(body as GuidePostData)
      return NextResponse.json({
        success: true,
        message: "攻略发布成功",
        guideId
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "发布失败" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Failed to publish guide:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 