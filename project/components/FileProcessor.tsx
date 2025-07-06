'use client'

import { useState, useEffect } from 'react'
import { File, CheckCircle, AlertCircle, Clock, Download, Upload as UploadIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractAudioFromVideo, getFileType } from '@/lib/ffmpeg'
import { supabase, isSupabaseReady } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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

interface FileProcessorProps {
  files: File[]
  onProcessingComplete: (results: ProcessingFile[]) => void
}

export function FileProcessor({ files, onProcessingComplete }: FileProcessorProps) {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])

  useEffect(() => {
    if (files.length === 0) return

    const initialFiles: ProcessingFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      type: getFileType(file),
      status: 'pending',
      progress: 0,
    }))

    console.log('🚀 Starting file processing for', initialFiles.length, 'files')
    setProcessingFiles(initialFiles)
    processFiles(initialFiles)
  }, [files])

  const processFiles = async (filesToProcess: ProcessingFile[]) => {
    console.log('📁 Processing files:', filesToProcess.map(f => f.file.name))
    
    // Process files sequentially to avoid overwhelming the browser
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileItem = filesToProcess[i]
      console.log(`🔄 Processing file ${i + 1}/${filesToProcess.length}: ${fileItem.file.name}`)
      await processFile(fileItem)
    }
    
    // Call completion callback after ALL files are processed
    console.log('✅ All files processed, calling completion callback')
    setProcessingFiles(currentFiles => {
      onProcessingComplete(currentFiles)
      return currentFiles
    })
  }

  const processFile = async (fileItem: ProcessingFile) => {
    try {
      console.log(`📝 Starting processing for: ${fileItem.file.name} (${fileItem.type})`)
      updateFileStatus(fileItem.id, 'processing', 10)

      let blobToUpload: Blob
      let fileName: string
      let mimeType: string
      let transcriptText: string | undefined

      if (fileItem.type === 'video') {
        console.log(`🎥 Extracting audio from video: ${fileItem.file.name}`)
        updateFileStatus(fileItem.id, 'processing', 30, 'Extracting audio...')
        
        try {
          blobToUpload = await extractAudioFromVideo(fileItem.file)
          fileName = `${fileItem.file.name.split('.')[0]}.wav`
          mimeType = 'audio/wav'
          console.log(`✅ Audio extraction completed for: ${fileItem.file.name}`)
          
          // Transcribe the extracted audio
          console.log(`🎤 Starting transcription for video: ${fileItem.file.name}`)
          updateFileStatus(fileItem.id, 'processing', 50, 'Transcribing audio...')
          
          try {
            // Only import transcription in browser environment
            if (typeof window !== 'undefined') {
              const { transcribeAudio } = await import('@/lib/transcription')
              transcriptText = await transcribeAudio(blobToUpload)
              console.log(`✅ Video transcription completed for: ${fileItem.file.name}`)
            } else {
              throw new Error('Transcription not available in server environment')
            }
          } catch (transcribeError) {
            console.error(`❌ Transcription failed for ${fileItem.file.name}:`, transcribeError)
            // Continue with upload even if transcription fails
            transcriptText = `Transcription failed: ${transcribeError instanceof Error ? transcribeError.message : 'Unknown error'}`
          }
        } catch (extractError) {
          console.error(`❌ Audio extraction failed for ${fileItem.file.name}:`, extractError)
          throw new Error(`Audio extraction failed: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`)
        }
      } else if (fileItem.type === 'audio') {
        console.log(`🎵 Processing audio file: ${fileItem.file.name}`)
        updateFileStatus(fileItem.id, 'processing', 30, 'Transcribing audio...')
        
        try {
          // Only import transcription in browser environment
          if (typeof window !== 'undefined') {
            const { transcribeAudio } = await import('@/lib/transcription')
            transcriptText = await transcribeAudio(fileItem.file)
            console.log(`✅ Audio transcription completed for: ${fileItem.file.name}`)
          } else {
            throw new Error('Transcription not available in server environment')
          }
        } catch (transcribeError) {
          console.error(`❌ Transcription failed for ${fileItem.file.name}:`, transcribeError)
          // Continue with upload even if transcription fails
          transcriptText = `Transcription failed: ${transcribeError instanceof Error ? transcribeError.message : 'Unknown error'}`
        }
        
        blobToUpload = fileItem.file
        fileName = fileItem.file.name
        mimeType = fileItem.file.type
      } else if (fileItem.type === 'text') {
        console.log(`📄 Reading text content from: ${fileItem.file.name}`)
        updateFileStatus(fileItem.id, 'processing', 30, 'Reading text content...')
        
        try {
          transcriptText = await fileItem.file.text()
          console.log(`✅ Text content read for: ${fileItem.file.name} (${transcriptText.length} characters)`)
        } catch (textError) {
          console.error(`❌ Failed to read text content for ${fileItem.file.name}:`, textError)
          throw new Error(`Failed to read text content: ${textError instanceof Error ? textError.message : 'Unknown error'}`)
        }
        
        blobToUpload = new Blob([transcriptText], { type: 'text/plain' })
        fileName = fileItem.file.name
        mimeType = 'text/plain'
      }

      console.log(`☁️ Uploading to Supabase: ${fileName}`)
      updateFileStatus(fileItem.id, 'processing', 70, 'Uploading to Supabase...')

      // Check if Supabase is properly configured with real credentials
      if (!isSupabaseReady()) {
        throw new Error('Supabase is not configured. Please update your .env.local file with your actual Supabase project URL and API key, then restart the development server.')
      }

      try {
        const { data, error } = await supabase.storage
          .from('media-files')
          .upload(`processed/${Date.now()}-${fileName}`, blobToUpload, {
            contentType: mimeType,
            upsert: false
          })

        if (error) {
          console.error(`❌ Supabase upload failed for ${fileName}:`, error)
          throw new Error(`Upload failed: ${error.message}. Please ensure the 'media-files' bucket exists and has proper permissions.`)
        }

        console.log(`✅ Upload successful for ${fileName}:`, data.path)

        const { data: publicUrl } = supabase.storage
          .from('media-files')
          .getPublicUrl(data.path)

        console.log(`🔗 Generated public URL for ${fileName}:`, publicUrl.publicUrl)
        
        // Store transcript in Supabase if we have one
        if (transcriptText && transcriptText.trim()) {
          console.log(`💾 Storing transcript in Supabase for: ${fileName}`)
          console.log(`📝 Transcript content length: ${transcriptText.length} characters`)
          updateFileStatus(fileItem.id, 'processing', 95, 'Saving transcript...')
          
          try {
            const transcriptData = {
              file_name: fileName,
              file_url: publicUrl.publicUrl,
              content: transcriptText,
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            console.log(`📊 Inserting transcript data:`, {
              file_name: transcriptData.file_name,
              file_url: transcriptData.file_url,
              content_length: transcriptData.content.length,
              status: transcriptData.status
            })
            
            const { data: insertedData, error: transcriptError } = await supabase
              .from('transcripts')
              .insert(transcriptData)
              .select()
            
            if (transcriptError) {
              console.error(`❌ Failed to store transcript for ${fileName}:`, {
                error: transcriptError,
                message: transcriptError.message,
                details: transcriptError.details,
                hint: transcriptError.hint,
                code: transcriptError.code
              })
              console.warn(`⚠️ Transcript storage failed but continuing with file processing`)
            } else {
              console.log(`✅ Transcript stored successfully for: ${fileName}`)
              console.log(`📊 Inserted transcript data:`, insertedData)
            }
          } catch (dbError) {
            console.error(`❌ Database error storing transcript for ${fileName}:`, {
              error: dbError,
              message: dbError instanceof Error ? dbError.message : 'Unknown error',
              stack: dbError instanceof Error ? dbError.stack : undefined
            })
            console.warn(`⚠️ Database error but continuing with file processing`)
          }
        }
        
        updateFileStatus(fileItem.id, 'completed', 100, undefined, blobToUpload, publicUrl.publicUrl, transcriptText)
        
      } catch (uploadError) {
        console.error(`❌ Upload process failed for ${fileName}:`, uploadError)
        
        // Provide more specific error guidance
        if (uploadError instanceof Error) {
          if (uploadError.message.includes('Failed to fetch') || uploadError.message.includes('fetch')) {
            if (!isSupabaseReady()) {
              throw new Error(`Supabase Configuration Error: Please update your .env.local file with your actual Supabase project credentials and restart the development server.`)
            } else {
              throw new Error(`Network error: Unable to connect to Supabase. Please check your internet connection and verify your Supabase project is active.`)
            }
          } else if (uploadError.message.includes('bucket')) {
            throw new Error(`Storage bucket error: ${uploadError.message}. Please ensure the 'media-files' bucket exists in your Supabase project.`)
          }
        }
        
        throw uploadError
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error(`❌ Processing failed for ${fileItem.file.name}:`, errorMessage)
      updateFileStatus(fileItem.id, 'error', 0, errorMessage)
    }
  }

  const updateFileStatus = (
    id: string,
    status: ProcessingFile['status'],
    progress: number,
    errorMessage?: string,
    processedBlob?: Blob,
    uploadUrl?: string,
    transcriptText?: string
  ) => {
    console.log(`📊 Updating status for ${id}: ${status} (${progress}%)${errorMessage ? ` - Error: ${errorMessage}` : ''}`)
    
    setProcessingFiles(prev =>
      prev.map(file =>
        file.id === id
          ? { ...file, status, progress, errorMessage, processedBlob, uploadUrl, transcriptText }
          : file
      )
    )
  }

  const downloadFile = (fileItem: ProcessingFile) => {
    if (!fileItem.processedBlob) return

    console.log(`💾 Downloading file: ${fileItem.file.name}`)
    const url = URL.createObjectURL(fileItem.processedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileItem.type === 'video' ? `${fileItem.file.name.split('.')[0]}.wav` : fileItem.file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadTranscript = (fileItem: ProcessingFile) => {
    if (!fileItem.transcriptText) return

    console.log(`📄 Downloading transcript for: ${fileItem.file.name}`)
    const blob = new Blob([fileItem.transcriptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileItem.file.name.split('.')[0]}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Clock className="h-4 w-4 text-primary animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusText = (fileItem: ProcessingFile) => {
    switch (fileItem.status) {
      case 'pending':
        return 'Waiting to process...'
      case 'processing':
        return fileItem.errorMessage || 'Processing...'
      case 'completed':
        return 'Processing complete!'
      case 'error':
        return `Error: ${fileItem.errorMessage}`
      default:
        return ''
    }
  }

  if (processingFiles.length === 0) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Processing Files
        </CardTitle>
        <CardDescription>
          {processingFiles.filter(f => f.status === 'completed').length} of {processingFiles.length} files processed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {processingFiles.map(fileItem => (
          <div key={fileItem.id} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(fileItem.status)}
                <span className="text-sm font-medium truncate">{fileItem.file.name}</span>
                <Badge variant="outline" className="ml-2">
                  {fileItem.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {fileItem.status === 'completed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(fileItem)}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    {fileItem.transcriptText && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript(fileItem)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Transcript
                      </Button>
                    )}
                    {fileItem.uploadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(fileItem.uploadUrl, '_blank')}
                        className="gap-1"
                      >
                        <UploadIcon className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={fileItem.progress} className="h-2" />
              <p className={cn(
                "text-sm",
                fileItem.status === 'error' ? "text-destructive" : "text-muted-foreground"
              )}>
                {getStatusText(fileItem)}
              </p>
              {fileItem.transcriptText && fileItem.status === 'completed' && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Transcript Preview:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {fileItem.transcriptText.length > 500 
                      ? `${fileItem.transcriptText.substring(0, 500)}...` 
                      : fileItem.transcriptText}
                  </p>
                  {fileItem.transcriptText.length > 500 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing first 500 characters. Download full transcript to see complete text.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}