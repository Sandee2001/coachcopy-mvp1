'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { FileProcessor } from '@/components/FileProcessor'
import { ProcessingStats } from '@/components/ProcessingStats'
import { Upload, Shield, Globe } from 'lucide-react'

interface ProcessingFile {
  id: string
  file: File
  type: 'video' | 'audio' | 'text' | 'unknown'
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  processedBlob?: Blob
  errorMessage?: string
  uploadUrl?: string
  transcriptText?: string
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processingResults, setProcessingResults] = useState<ProcessingFile[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)

  const handleFilesSelected = (files: File[]) => {
    console.log('📁 Files selected:', files.map(f => f.name))
    setSelectedFiles(files)
    setProcessingResults([])
    setStartTime(new Date())
  }

  const handleProcessingComplete = (results: ProcessingFile[]) => {
    console.log('✅ Processing complete for all files')
    setProcessingResults(results)
  }

  const completedFiles = processingResults.filter(f => f.status === 'completed').length
  const errorFiles = processingResults.filter(f => f.status === 'error').length
  const processingTime = startTime ? `${Math.round((Date.now() - startTime.getTime()) / 1000)}s` : undefined

  const resetFiles = () => {
    setSelectedFiles([])
    setProcessingResults([])
    setStartTime(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3">
              <div className="h-8 w-8 bg-white rounded-sm flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">⚡</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CoachCopy
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Extract audio from videos, process files, and store them securely in the cloud. All processing happens in your browser.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-blue-50 p-4 mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Upload</h3>
              <p className="text-sm text-slate-600">
                Drag & drop files with automatic type detection and validation
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-purple-50 p-4 mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Browser Processing</h3>
              <p className="text-sm text-slate-600">
                All media processing happens locally in your browser for privacy
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-green-50 p-4 mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cloud Storage</h3>
              <p className="text-sm text-slate-600">
                Secure cloud storage with Supabase for easy access and sharing
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* File Upload */}
          <FileUpload onFilesSelected={handleFilesSelected} />

          {/* Processing Stats */}
          {selectedFiles.length > 0 && (
            <ProcessingStats
              totalFiles={selectedFiles.length}
              completedFiles={completedFiles}
              errorFiles={errorFiles}
              processingTime={processingTime}
            />
          )}

          {/* File Processor */}
          {selectedFiles.length > 0 && (
            <FileProcessor
              files={selectedFiles}
              onProcessingComplete={handleProcessingComplete}
            />
          )}

          {/* Processing Complete Section */}
          {processingResults.length > 0 && completedFiles + errorFiles === selectedFiles.length && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Processing Complete</h3>
                  <p className="text-sm text-slate-600">
                    {completedFiles} files processed successfully
                  </p>
                </div>
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {completedFiles + errorFiles} files processed
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Your files have been processed and are ready for download or viewing
              </p>
              <button
                onClick={resetFiles}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Process More Files
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500">
            Built with Next.js, React, and Supabase. All processing happens securely in your browser.
          </p>
        </div>
      </div>
    </div>
  )
}