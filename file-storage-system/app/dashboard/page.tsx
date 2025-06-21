"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ArrowLeft, Shield, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const [personalPassword, setPersonalPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePersonalAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/verify-personal-vault-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: personalPassword }),
      })

      if (response.ok) {
        router.push("/files/personal")
      } else {
        setError("Invalid personal vault password")
      }
    } catch (error) {
      setError("Authentication failed")
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link href="/auth">
            <Button variant="ghost" className="mb-4 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">Vault Dashboard</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Choose Your Vault
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">Access your shared files or secure personal vault</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Shared Files */}
            <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
              <CardHeader className="text-center relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white font-bold">Shared Vault</CardTitle>
                <CardDescription className="text-white/70 text-lg">
                  Files accessible to all authorized users
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center relative">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Features</p>
                    <div className="space-y-1 text-white/80 text-sm">
                      <p>• Collaborative file sharing</p>
                      <p>• Team accessible storage</p>
                      <p>• Public file management</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push("/files/shared")}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-xl font-semibold shadow-xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Access Shared Vault
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personal Files */}
            <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
              <CardHeader className="text-center relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white font-bold">Personal Vault</CardTitle>
                <CardDescription className="text-white/70 text-lg">
                  Your private files with enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Security Features</p>
                  <div className="space-y-1 text-white/80 text-sm">
                    <p>• End-to-end encryption</p>
                    <p>• Personal password protection</p>
                    <p>• Private file storage</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="personalPassword" className="text-white font-medium">
                    Personal Vault Password
                  </Label>
                  <Input
                    id="personalPassword"
                    type="password"
                    value={personalPassword}
                    onChange={(e) => setPersonalPassword(e.target.value)}
                    placeholder="Enter your personal vault password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handlePersonalAccess}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Access Personal Vault
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
