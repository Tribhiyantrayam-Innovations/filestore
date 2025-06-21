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

function getFileCategory(mimetype: string): string {
  if (mimetype.startsWith("image/")) return "image"
  if (mimetype.startsWith("audio/")) return "audio"
  if (mimetype.startsWith("video/")) return "video"
  if (mimetype.includes("pdf")) return "document"
  if (mimetype.includes("word") || mimetype.includes("document")) return "document"
  if (mimetype.includes("sheet") || mimetype.includes("excel")) return "document"
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "presentation"
  return "other"
}

export async function POST(request: NextRequest) {
  try {
    console.log("Finalize upload route called")

    const db = await connectToDatabase()
    const { uploadId, fileName, fileSize, mimeType, folder, totalChunks } = await request.json()

    if (!uploadId || !fileName || !fileSize || !folder || !totalChunks) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`Finalizing upload for ${fileName} with ${totalChunks} chunks`)

    // Retrieve all chunks for this upload
    const chunks = await db.collection("upload_chunks").find({ uploadId }).sort({ chunkIndex: 1 }).toArray()

    if (chunks.length !== totalChunks) {
      return NextResponse.json(
        { error: `Missing chunks. Expected ${totalChunks}, found ${chunks.length}` },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `${timestamp}-${randomSuffix}-${fileName}`

    const category = getFileCategory(mimeType)

    // Create final file document
    const fileDoc = {
      filename: uniqueFileName,
      originalName: fileName,
      mimetype: mimeType,
      size: fileSize,
      folder: folder,
      category: category,
      uploadDate: new Date(),
      isChunked: true,
      totalChunks: totalChunks,
      chunks: chunks.map((chunk) => chunk.chunkData),
    }

    // Save the complete file
    const result = await db.collection("files").insertOne(fileDoc)

    // Clean up chunks
    await db.collection("upload_chunks").deleteMany({ uploadId })

    console.log(`File finalized with ID: ${result.insertedId}`)

    return NextResponse.json({
      message: "Upload finalized successfully",
      fileId: result.insertedId,
      filename: uniqueFileName,
    })
  } catch (error) {
    console.error("Finalize upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to finalize upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
