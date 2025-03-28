import { NextResponse } from "next/server"
import { DetectEquipmentType, EquipmentDetectResults } from "@/lib/types"

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json()
      // console.log("Parsed request body:", body);
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

    console.log("Type:", body.type);
    // console.log("Contents:", body.contents);
    const { type, contents } = body as { type: DetectEquipmentType, contents: string[] }

    if (!type || !contents) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log("Request URL:", `${process.env.DETECT_API_BASE_URL}/detect/${type}`);
    console.log("Request body content length:", contents.length);
    
    const response = await fetch(`${process.env.DETECT_API_BASE_URL}/detect/${type}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contents }),
    });
    
    console.log("Response status:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: await response.json() },
        { status: 500 }
      )
    }

    const results = await response.json() as EquipmentDetectResults[]

    console.log("Results:", results);

    return NextResponse.json(
      results,
    )

  } catch (error) {
    console.error("Recognition error:", error)
    return NextResponse.json(
      { error: "Internal server error:" + error },
      { status: 500 }
    )
  }
} 