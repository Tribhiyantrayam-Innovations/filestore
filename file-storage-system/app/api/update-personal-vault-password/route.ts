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
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 })
    }

    // Get stored password
    const storedPassword = await db.collection("personal_vault_passwords").findOne({ type: "personal_vault" })

    if (!storedPassword) {
      return NextResponse.json({ error: "No personal vault password found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, storedPassword.password)

    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update the password
    await db.collection("personal_vault_passwords").updateOne(
      { type: "personal_vault" },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ message: "Personal vault password updated successfully" })
  } catch (error) {
    console.error("Update personal vault password error:", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}
