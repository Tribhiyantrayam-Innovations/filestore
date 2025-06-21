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

    // Get stored password
    const storedPassword = await db.collection("personal_vault_passwords").findOne({ type: "personal_vault" })

    if (!storedPassword) {
      return NextResponse.json({ error: "No personal vault password set" }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, storedPassword.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    return NextResponse.json({ message: "Password verified successfully" })
  } catch (error) {
    console.error("Verify personal vault password error:", error)
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 })
  }
}
