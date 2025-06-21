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
    console.log("Chunk upload route called")

    const db = await connectToDatabase()
    const formData = await request.formData()

    const chunk = formData.get("chunk") as File
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const fileName = formData.get("fileName") as string
    const folder = formData.get("folder") as string
    const uploadId = formData.get("uploadId") as string

    if (!chunk || chunkIndex === undefined || !totalChunks || !fileName || !folder || !uploadId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`)

    // Convert chunk to base64
    const bytes = await chunk.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const chunkData = buffer.toString("base64")

    // Store chunk in database
    const chunkDoc = {
      uploadId,
      fileName,
      folder,
      chunkIndex,
      totalChunks,
      chunkData,
      uploadDate: new Date(),
    }

    await db.collection("upload_chunks").insertOne(chunkDoc)

    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} stored successfully`)

    return NextResponse.json({
      message: "Chunk uploaded successfully",
      chunkIndex,
      totalChunks,
    })
  } catch (error) {
    console.error("Chunk upload error:", error)
    return NextResponse.json(
      {
        error: "Chunk upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
