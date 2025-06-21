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

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching files list")

    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder")

    if (!folder) {
      return NextResponse.json({ error: "Folder parameter required" }, { status: 400 })
    }

    console.log(`Fetching files for folder: ${folder}`)

    const files = await db.collection("files").find({ folder: folder }).sort({ uploadDate: -1 }).toArray()

    console.log(`Found ${files.length} files`)

    const formattedFiles = files.map((file) => ({
      _id: file._id.toString(),
      filename: file.filename,
      originalName: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      folder: file.folder,
      category: file.category,
      uploadDate: file.uploadDate,
    }))

    return NextResponse.json(formattedFiles)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch files",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
