import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
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
    console.log("Upload route called")

    // Connect to database
    const db = await connectToDatabase()
    console.log("Database connected")

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const folder = formData.get("folder") as string

    console.log(`Received ${files.length} files for folder: ${folder}`)

    if (!files.length || !folder) {
      return NextResponse.json({ error: "Missing files or folder" }, { status: 400 })
    }

    // Use /tmp directory which is writable on Vercel
    const uploadDir = path.join("/tmp", "uploads", folder)
    console.log(`Upload directory: ${uploadDir}`)

    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
      console.log("Upload directory created")
    }

    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`Processing file ${index + 1}: ${file.name}`)

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate unique filename
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const filename = `${timestamp}-${randomSuffix}-${file.name}`
        const filepath = path.join(uploadDir, filename)

        console.log(`Saving file to: ${filepath}`)

        // Save file to /tmp directory
        await writeFile(filepath, buffer)
        console.log(`File saved: ${filename}`)

        const category = getFileCategory(file.type)

        // Save file metadata to database
        const fileDoc = {
          filename: filename,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          folder: folder,
          category: category,
          uploadDate: new Date(),
          filePath: filepath,
          // Store file as base64 in database for persistence (since /tmp is ephemeral)
          fileData: buffer.toString("base64"),
        }

        const result = await db.collection("files").insertOne(fileDoc)
        console.log(`File metadata saved with ID: ${result.insertedId}`)

        return fileDoc
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)
        throw fileError
      }
    })

    await Promise.all(uploadPromises)
    console.log("All files processed successfully")

    return NextResponse.json({
      message: "Files uploaded successfully",
      count: files.length,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
