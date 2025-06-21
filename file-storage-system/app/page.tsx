"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  File,
  ImageIcon,
  FileText,
  Music,
  Video,
  Presentation,
  Eye,
  Sparkles,
  Shield,
  Zap,
  X,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([])
  const [folder, setFolder] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>("")
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB per file
  const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024 // 2GB total
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks for better reliability

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = validateFiles(selectedFiles)
      setFiles(validFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const selectedFiles = Array.from(e.dataTransfer.files)
      const validFiles = validateFiles(selectedFiles)
      setFiles(validFiles)
    }
  }

  const validateFiles = (selectedFiles: File[]) => {
    setError("")
    const validFiles: File[] = []
    let totalSize = 0
    let hasError = false

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum file size is 500MB.`)
        hasError = true
        break
      }
      totalSize += file.size
      if (totalSize > MAX_TOTAL_SIZE) {
        setError(`Total file size exceeds 2GB limit. Please select fewer files.`)
        hasError = true
        break
      }
      validFiles.push(file)
    }

    return hasError ? [] : validFiles
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-6 w-6 text-blue-500" />
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />
      case "doc":
      case "docx":
        return <FileText className="h-6 w-6 text-blue-600" />
      case "xls":
      case "xlsx":
        return <FileText className="h-6 w-6 text-green-600" />
      case "mp3":
      case "wav":
      case "flac":
        return <Music className="h-6 w-6 text-purple-500" />
      case "mp4":
      case "avi":
      case "mov":
        return <Video className="h-6 w-6 text-orange-500" />
      case "ppt":
      case "pptx":
        return <Presentation className="h-6 w-6 text-orange-600" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  const uploadChunk = async (
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    fileName: string,
    folder: string,
    uploadId: string,
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("fileName", fileName)
      formData.append("folder", folder)
      formData.append("uploadId", uploadId)

      const xhr = new XMLHttpRequest()

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(true)
        } else {
          reject(new Error(`Chunk upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Chunk upload failed"))
      })

      xhr.open("POST", "/api/upload-chunk")
      xhr.send(formData)
    })
  }

  const uploadFileWithChunks = async (file: File, folder: string): Promise<boolean> => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    try {
      // Upload file in chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        await uploadChunk(chunk, chunkIndex, totalChunks, file.name, folder, uploadId)

        // Update progress based on chunks uploaded
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        setUploadProgress(progress)

        // Small delay between chunks to prevent overwhelming the server
        if (chunkIndex < totalChunks - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Finalize the upload
      const finalizeResponse = await fetch("/api/finalize-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          folder,
          totalChunks,
        }),
      })

      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload")
      }

      return true
    } catch (error) {
      // Clean up failed upload
      try {
        await fetch("/api/cleanup-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadId }),
        })
      } catch (cleanupError) {
        console.error("Failed to cleanup upload:", cleanupError)
      }
      throw error
    }
  }

  const uploadSmallFile = async (file: File, folder: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(true)
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"))
      })

      xhr.open("POST", "/api/upload-single")
      xhr.send(formData)
    })
  }

  const handleUpload = async () => {
    if (files.length === 0 || !folder) {
      setError("Please select files and folder")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadedCount(0)
    setTotalFiles(files.length)
    setError("")

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFile(file.name)
        setUploadProgress(0)

        try {
          // Use chunked upload for files larger than 20MB
          if (file.size > 20 * 1024 * 1024) {
            await uploadFileWithChunks(file, folder)
          } else {
            await uploadSmallFile(file, folder)
          }

          setUploadedCount(i + 1)
          setUploadProgress(100)

          // Brief pause between files
          if (i < files.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          setError(`Failed to upload ${file.name}. ${error instanceof Error ? error.message : "Unknown error"}`)
          break
        }
      }

      if (uploadedCount === files.length || uploadedCount === files.length - 1) {
        setFiles([])
        setFolder("")
        setCurrentFile("")
        setTimeout(() => {
          setUploadProgress(0)
          setUploadedCount(0)
          setTotalFiles(0)
        }, 3000)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-6 pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">Advanced File Storage</span>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              CloudVault Pro
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto leading-relaxed">
              Upload, organize, and manage your files with military-grade security and lightning-fast performance
            </p>
            <Button
              onClick={() => router.push("/auth")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Eye className="mr-2 h-5 w-5" />
              Access Vault
            </Button>
          </div>

          {/* Upload Card */}
          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-white text-2xl">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                Upload Files
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Drag & drop or select multiple files to upload to your secure vault (Max: 500MB per file, 2GB total)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-purple-400 transition-colors duration-300 bg-white/5"
              >
                <Upload className="h-12 w-12 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 mb-2">Drag & drop files here</p>
                <p className="text-white/60 text-sm mb-4">or</p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.mp3,.wav,.flac,.mp4,.avi,.mov,.ppt,.pptx"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 inline-block"
                >
                  Choose Files
                </Label>
              </div>

              {/* Folder Selection */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Destination Vault</Label>
                <Select value={folder} onValueChange={setFolder}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select vault location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">🌐 Shared Vault</SelectItem>
                    <SelectItem value="personal">🔒 Personal Vault</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium">Selected Files ({files.length})</Label>
                    <div className="text-white/70 text-sm">Total: {formatFileSize(getTotalSize())}</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-black/20 rounded-xl border border-white/10">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/10 group"
                      >
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm truncate block">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-xs">{formatFileSize(file.size)}</span>
                            {file.size > 20 * 1024 * 1024 && (
                              <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-0.5 rounded">
                                Chunked Upload
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium">Upload Progress</Label>
                      <span className="text-white/70 text-sm">
                        {uploadedCount}/{totalFiles} files completed
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="w-full h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {currentFile &&
                          `Uploading: ${currentFile.length > 30 ? currentFile.substring(0, 30) + "..." : currentFile}`}
                      </span>
                      <span className="text-white/70">{uploadProgress}%</span>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Overall Progress</Label>
                    <Progress value={totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0} className="w-full h-2" />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !folder}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold text-lg shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading to Vault... ({uploadedCount}/{totalFiles})
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Upload to Vault
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Chunked Upload</h3>
                <p className="text-white/70 text-sm">
                  Large files uploaded in chunks for reliability and progress tracking
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-fit mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Smart Organization</h3>
                <p className="text-white/70 text-sm">Automatic categorization and intelligent file management</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-gradient-to-r from-pink-600 to-red-600 rounded-full w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Military-Grade Security</h3>
                <p className="text-white/70 text-sm">Advanced encryption and multi-layer password protection</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
