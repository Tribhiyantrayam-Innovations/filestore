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
    console.log("Single file upload route called")

    // Connect to database
    const db = await connectToDatabase()
    console.log("Database connected")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string

    console.log(`Received file: ${file?.name} for folder: ${folder}`)

    if (!file || !folder) {
      return NextResponse.json({ error: "Missing file or folder" }, { status: 400 })
    }

    // Check file size (5GB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5GB." }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomSuffix}-${file.name}`

    console.log(`Generated filename: ${filename}`)

    const category = getFileCategory(file.type)

    // For very large files, we'll store them in chunks to avoid memory issues
    const CHUNK_SIZE = 16 * 1024 * 1024 // 16MB chunks
    const chunks = []

    if (buffer.length > CHUNK_SIZE) {
      // Split large files into chunks
      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + CHUNK_SIZE)
        chunks.push(chunk.toString("base64"))
      }

      // Save file metadata with chunked data
      const fileDoc = {
        filename: filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        folder: folder,
        category: category,
        uploadDate: new Date(),
        isChunked: true,
        totalChunks: chunks.length,
        chunks: chunks,
      }

      const result = await db.collection("files").insertOne(fileDoc)
      console.log(`Chunked file saved with ID: ${result.insertedId}`)
    } else {
      // Save smaller files normally
      const fileDoc = {
        filename: filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        folder: folder,
        category: category,
        uploadDate: new Date(),
        isChunked: false,
        fileData: buffer.toString("base64"),
      }

      const result = await db.collection("files").insertOne(fileDoc)
      console.log(`File saved with ID: ${result.insertedId}`)
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: filename,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
