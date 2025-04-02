import { NextResponse } from "next/server"
import { getGuide } from "@/lib/remote-db"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const guide = await getGuide(params.id)

    if (!guide) {
      return NextResponse.json(
        { error: "攻略未找到" },
        { status: 404 }
      )
    }

    return NextResponse.json(guide)
  } catch (error) {
    console.error("获取攻略失败:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
} 