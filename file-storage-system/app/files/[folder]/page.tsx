"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ImageIcon,
  FileText,
  Music,
  Video,
  Presentation,
  File,
  Download,
  Trash2,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface FileItem {
  _id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  folder: string
  category: string
  uploadDate: string
}

export default function FilesPage() {
  const params = useParams()
  const router = useRouter()
  const folder = params.folder as string
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const categories = [
    { name: "all", label: "All Files", icon: File, color: "text-gray-400" },
    { name: "image", label: "Images", icon: ImageIcon, color: "text-blue-400" },
    { name: "document", label: "Documents", icon: FileText, color: "text-red-400" },
    { name: "audio", label: "Audio", icon: Music, color: "text-purple-400" },
    { name: "video", label: "Videos", icon: Video, color: "text-orange-400" },
    { name: "presentation", label: "Presentations", icon: Presentation, color: "text-orange-400" },
    { name: "other", label: "Others", icon: File, color: "text-gray-400" },
  ]

  useEffect(() => {
    fetchFiles()
  }, [folder])

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?folder=${folder}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else {
        console.error("Failed to fetch files:", await response.text())
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/download/${fileId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error("Download failed:", await response.text())
        alert("Download failed")
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("Download failed")
    }
  }

  const handleDelete = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        const response = await fetch(`/api/files/${fileId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setFiles(files.filter((file) => file._id !== fileId))
          alert("File deleted successfully")
        } else {
          console.error("Delete failed:", await response.text())
          alert("Delete failed")
        }
      } catch (error) {
        console.error("Delete error:", error)
        alert("Delete failed")
      }
    }
  }

  const getFileIcon = (category: string) => {
    const categoryData = categories.find((cat) => cat.name === category)
    if (categoryData) {
      const Icon = categoryData.icon
      return <Icon className={`h-6 w-6 ${categoryData.color}`} />
    }
    return <File className="h-6 w-6 text-gray-400" />
  }

  const filteredFiles = files.filter((file) => file.originalName.toLowerCase().includes(searchTerm.toLowerCase()))

  const getFilesByCategory = (category: string) => {
    if (category === "all") return filteredFiles
    return filteredFiles.filter((file) => file.category === category)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading vault contents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-white/90 text-sm font-medium capitalize">{folder} Vault</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent capitalize">
                {folder} Files
              </h1>
              <p className="text-white/70 text-lg">
                Manage your {folder} vault files ({files.length} files)
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-80 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-white/10 backdrop-blur-xl border border-white/20">
              {categories.map((category) => {
                const Icon = category.icon
                const categoryFiles = getFilesByCategory(category.name)
                return (
                  <TabsTrigger
                    key={category.name}
                    value={category.name}
                    className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{category.label}</span>
                    <span className="text-xs bg-white/20 px-1 rounded">{categoryFiles.length}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.name} value={category.name} className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {getFilesByCategory(category.name).map((file) => (
                    <Card
                      key={file._id}
                      className="shadow-xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
                      <CardHeader className="pb-3 relative">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.category)}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium truncate text-white">
                                {file.originalName}
                              </CardTitle>
                              <CardDescription className="text-xs text-white/60">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-white/20 text-white/80 border-white/20 capitalize"
                          >
                            {file.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 relative">
                        <div className="flex gap-2 mb-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file._id, file.originalName)}
                            className="flex-1 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file._id)}
                            className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-white/50">
                          {new Date(file.uploadDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {getFilesByCategory(category.name).length === 0 && (
                  <div className="text-center py-16">
                    <div className="p-4 bg-white/5 rounded-full w-fit mx-auto mb-4">
                      <File className="h-12 w-12 text-white/40" />
                    </div>
                    <p className="text-white/60 text-lg">No files found in this category</p>
                    <p className="text-white/40 text-sm mt-2">Upload some files to get started</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
