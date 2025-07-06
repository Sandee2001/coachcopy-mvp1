import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

class FFmpegSingleton {
  private static instance: FFmpeg | null = null
  private static isLoaded = false

  static async getInstance(): Promise<FFmpeg> {
    if (!FFmpegSingleton.instance) {
      FFmpegSingleton.instance = new FFmpeg()
    }

    if (!FFmpegSingleton.isLoaded) {
      await FFmpegSingleton.loadFFmpeg()
    }

    return FFmpegSingleton.instance
  }

  private static async loadFFmpeg(): Promise<void> {
    const ffmpeg = FFmpegSingleton.instance!
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    
    FFmpegSingleton.isLoaded = true
  }
}

export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
  const ffmpeg = await FFmpegSingleton.getInstance()
  
  console.log(`🎬 Starting audio extraction from video: ${videoFile.name}`)
  console.log(`📊 Input video size: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB`)
  
  const inputName = 'input.mp4'
  const outputName = 'output.wav'
  
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()))
  
  console.log('🔧 Running FFmpeg audio extraction with full quality settings...')
  await ffmpeg.exec([
    '-i', inputName,
    '-vn', // No video
    '-acodec', 'pcm_s16le', // Uncompressed PCM
    '-ar', '16000', // 16kHz sample rate (optimal for Whisper)
    '-ac', '1', // Mono channel (sufficient for speech)
    '-t', '0', // Process entire duration (no time limit)
    '-avoid_negative_ts', 'make_zero', // Handle timestamp issues
    outputName
  ])
  
  const data = await ffmpeg.readFile(outputName)
  const audioBlob = new Blob([data], { type: 'audio/wav' })
  
  console.log(`✅ Audio extraction completed`)
  console.log(`📊 Output audio size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`)
  console.log(`📏 Audio data length: ${data.length} bytes`)
  
  return audioBlob
}

export function getFileType(file: File): 'video' | 'audio' | 'text' | 'unknown' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('text/') || file.name.endsWith('.txt')) return 'text'
  return 'unknown'
}