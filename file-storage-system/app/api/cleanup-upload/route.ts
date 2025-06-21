import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://aniketroy10100:database@cluster0.epwnny6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

let client: MongoClient

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db("filestore")
}

export async function POST(request: NextRequest) {
  try {
    console.log("Cleanup upload route called")

    const db = await connectToDatabase()
    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json({ error: "Missing uploadId" }, { status: 400 })
    }

    console.log(`Cleaning up upload: ${uploadId}`)

    // Delete all chunks for this upload
    const result = await db.collection("upload_chunks").deleteMany({ uploadId })

    console.log(`Cleaned up ${result.deletedCount} chunks`)

    return NextResponse.json({
      message: "Upload cleaned up successfully",
      deletedChunks: result.deletedCount,
    })
  } catch (error) {
    console.error("Cleanup upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to cleanup upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
