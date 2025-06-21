import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const db = await connectToDatabase()
    const vaultAccessPassword = await db.collection("vault_access_passwords").findOne({ type: "vault_access" })

    return NextResponse.json({ exists: !!vaultAccessPassword })
  } catch (error) {
    console.error("Check vault access password error:", error)
    return NextResponse.json({ error: "Failed to check password" }, { status: 500 })
  }
}
