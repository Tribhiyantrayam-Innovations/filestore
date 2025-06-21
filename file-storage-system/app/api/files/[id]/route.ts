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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Delete request for file ID: ${params.id}`)

    const db = await connectToDatabase()
    const fileId = new ObjectId(params.id)

    // Get file info first
    const file = await db.collection("files").findOne({ _id: fileId })
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log(`Deleting file: ${file.originalName}`)

    // Delete file record from database (file data is stored in the document)
    await db.collection("files").deleteOne({ _id: fileId })

    console.log("File deleted successfully")
    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
