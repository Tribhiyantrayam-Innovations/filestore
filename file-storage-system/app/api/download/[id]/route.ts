import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Download request for file ID: ${params.id}`)

    const db = await connectToDatabase()
    const fileId = new ObjectId(params.id)

    // Get file info
    const file = await db.collection("files").findOne({ _id: fileId })
    if (!file) {
      console.log("File not found in database")
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log(`Found file: ${file.originalName}`)

    let buffer: Buffer

    if (file.isChunked && file.chunks) {
      // Reconstruct chunked file
      console.log(`Reconstructing chunked file with ${file.totalChunks} chunks`)
      const chunks = file.chunks.map((chunk: string) => Buffer.from(chunk, "base64"))
      buffer = Buffer.concat(chunks)
    } else {
      // Regular file
      buffer = Buffer.from(file.fileData, "base64")
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimetype || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        error: "Download failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
