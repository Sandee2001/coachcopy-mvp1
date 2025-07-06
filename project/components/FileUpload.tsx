'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Music, Video, AlertCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function FileUpload({ onFilesSelected, maxFiles = 10, acceptedTypes }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
    setDragActive(false)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedTypes ? acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
      'text/*': ['.txt', '.md', '.csv']
    },
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  return (
    <Card className="relative overflow-hidden bg-white border-slate-200 shadow-sm">
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-300 p-12 text-center",
          isDragActive 
            ? "border-blue-400 bg-blue-50 scale-[1.01]" 
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className={cn(
            "rounded-full p-6 transition-all duration-300",
            isDragActive 
              ? "bg-blue-100 scale-110" 
              : "bg-slate-100"
          )}>
            <Upload className={cn(
              "h-12 w-12 transition-colors duration-300",
              isDragActive ? "text-blue-600" : "text-slate-500"
            )} />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold text-slate-900">
              {isDragActive ? "Drop your files here" : "Upload your files"}
            </h3>
            <p className="text-slate-600 max-w-md">
              Drag & drop files here, or click to select files. Supports video, audio, and text files.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white border-slate-200">
              <Video className="h-4 w-4 text-red-500" />
              Video Files
            </Badge>
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white border-slate-200">
              <Music className="h-4 w-4 text-green-500" />
              Audio Files
            </Badge>
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white border-slate-200">
              <FileText className="h-4 w-4 text-blue-500" />
              Text Files
            </Badge>
          </div>

          <div className="text-xs text-slate-500">
            Maximum {maxFiles} files • MP4, MP3, WAV, TXT supported
          </div>
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-red-700">
                <strong>{file.name}:</strong> {errors.map(e => e.message).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}