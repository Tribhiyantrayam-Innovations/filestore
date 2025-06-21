"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Edit, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ManagePersonalPasswordPage() {
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Create new password states
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Update password states
  const [currentPassword, setCurrentPassword] = useState("")
  const [updateNewPassword, setUpdateNewPassword] = useState("")
  const [updateConfirmPassword, setUpdateConfirmPassword] = useState("")

  useEffect(() => {
    checkPasswordExists()
  }, [])

  const checkPasswordExists = async () => {
    try {
      const response = await fetch("/api/check-personal-vault-password")
      if (response.ok) {
        const data = await response.json()
        setHasPassword(data.exists)
      }
    } catch (error) {
      console.error("Error checking password:", error)
    }
  }

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!validatePassword(newPassword)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/create-personal-vault-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        setSuccess("Personal vault password created successfully!")
        setNewPassword("")
        setConfirmPassword("")
        setHasPassword(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create password")
      }
    } catch (error) {
      setError("Failed to create password")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (updateNewPassword !== updateConfirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }

    if (!validatePassword(updateNewPassword)) {
      setError(
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/update-personal-vault-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: updateNewPassword,
        }),
      })

      if (response.ok) {
        setSuccess("Personal vault password updated successfully!")
        setCurrentPassword("")
        setUpdateNewPassword("")
        setUpdateConfirmPassword("")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update password")
      }
    } catch (error) {
      setError("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">Personal Vault Security</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Manage Personal Vault Password
            </h1>
            <p className="text-white/70 text-lg">Create or update your personal vault access password</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
            <CardContent className="p-6 relative">
              <Tabs defaultValue={hasPassword ? "update" : "create"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/20">
                  <TabsTrigger
                    value="create"
                    className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                    Create New
                  </TabsTrigger>
                  <TabsTrigger
                    value="update"
                    disabled={!hasPassword}
                    className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20 disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4" />
                    Update
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Personal Vault Password
                      </CardTitle>
                      <CardDescription className="text-white/70">
                        Set up a secure password for your personal vault. Must contain at least one uppercase letter,
                        one lowercase letter, one number, and one special character.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreatePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white">
                            Enter Your Access Code
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new access code"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-white">
                            Confirm Access Code
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm access code"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            "Create Password"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="update" className="mt-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Update Personal Vault Password
                      </CardTitle>
                      <CardDescription className="text-white/70">
                        Change your existing personal vault password. New password must contain at least one uppercase
                        letter, one lowercase letter, one number, and one special character.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-white">
                            Previous Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="updateNewPassword" className="text-white">
                            New Password
                          </Label>
                          <Input
                            id="updateNewPassword"
                            type="password"
                            value={updateNewPassword}
                            onChange={(e) => setUpdateNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="updateConfirmPassword" className="text-white">
                            Confirm Password
                          </Label>
                          <Input
                            id="updateConfirmPassword"
                            type="password"
                            value={updateConfirmPassword}
                            onChange={(e) => setUpdateConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 text-sm text-center">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm text-center">{success}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
