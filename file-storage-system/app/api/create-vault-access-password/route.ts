import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

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
    const db = await connectToDatabase()
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Check if vault access password already exists
    const existingPassword = await db.collection("vault_access_passwords").findOne({ type: "vault_access" })
    if (existingPassword) {
      return NextResponse.json({ error: "Vault access password already exists" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Store the password
    await db.collection("vault_access_passwords").insertOne({
      type: "vault_access",
      password: hashedPassword,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Vault access password created successfully" })
  } catch (error) {
    console.error("Create vault access password error:", error)
    return NextResponse.json({ error: "Failed to create password" }, { status: 500 })
  }
}
