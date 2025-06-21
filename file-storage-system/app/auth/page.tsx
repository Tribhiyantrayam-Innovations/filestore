"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, ArrowLeft, Shield, Sparkles, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AuthPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasVaultPassword, setHasVaultPassword] = useState(false)
  const [checkingPassword, setCheckingPassword] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkVaultPassword()
  }, [])

  const checkVaultPassword = async () => {
    try {
      const response = await fetch("/api/check-vault-access-password")
      if (response.ok) {
        const data = await response.json()
        setHasVaultPassword(data.exists)
      }
    } catch (error) {
      console.error("Error checking vault password:", error)
    } finally {
      setCheckingPassword(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/verify-vault-access-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        setError("Access denied - Invalid security code")
      }
    } catch (error) {
      setError("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  if (checkingPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/70">Checking vault status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </Link>

          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
            <CardHeader className="text-center relative">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-white/90 text-sm font-medium">Secure Access</span>
              </div>
              <CardTitle className="text-3xl text-white font-bold">Vault Access</CardTitle>
              <CardDescription className="text-white/70 text-lg">
                {hasVaultPassword
                  ? "Enter your security code to access the file vault"
                  : "Create a security code to set up your vault"}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              {hasVaultPassword ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">
                      Security Code
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your access code"
                      className="text-center bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-200 text-sm text-center">{error}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold text-lg shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Access Vault
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/80 text-sm">No vault password found. Create one to get started.</p>
                  </div>
                  <Button
                    onClick={() => router.push("/manage-vault-access-password")}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold text-lg shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Vault Password
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
