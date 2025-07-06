"use client"

// Browser-only transcription module with proper audio processing

let transformersModule: any = null
let transcriber: any = null

async function loadTransformers() {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Transformers can only be loaded in the browser')
  }
  
  if (!transformersModule) {
    console.log('📦 Dynamically loading @xenova/transformers...')
    try {
      // Use dynamic import with proper error handling
      const module = await import('@xenova/transformers')
      
      // Immediately disable all Node.js backends
      if (module.env) {
        // Configure for browser-only execution
        module.env.allowLocalModels = false
        module.env.allowRemoteModels = true
        module.env.useBrowserCache = true
        module.env.backends = {
          onnx: {
            wasm: {
              wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/',
            }
          }
        }
      }
      
      transformersModule = module
      console.log('✅ Transformers module loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load transformers module:', error)
      throw new Error(`Failed to load transformers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  return transformersModule
}

async function getTranscriber() {
  // Double-check browser environment
  if (typeof window === 'undefined') {
    throw new Error('Transcriber can only be initialized in the browser')
  }
  
  if (!transcriber) {
    console.log('🤖 Initializing Whisper transcriber (whisper-tiny.en)...')
    try {
      const { pipeline } = await loadTransformers()
      
      // Initialize with explicit browser configuration
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        device: 'cpu',
        dtype: 'fp32',
        revision: 'main',
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`📥 Downloading model: ${progress.name} (${Math.round(progress.progress)}%)`)
          }
        }
      })
      
      console.log('✅ Whisper transcriber initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Whisper transcriber:', error)
      throw new Error(`Whisper initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  return transcriber
}

// Convert audio blob to Float32Array for Whisper processing
async function processAudioBlob(audioBlob: Blob): Promise<Float32Array> {
  console.log('🎵 Processing audio blob to Float32Array...')
  
  // Create audio context for processing
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000 // Whisper expects 16kHz
  })
  
  try {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    console.log(`📊 Audio buffer size: ${arrayBuffer.byteLength} bytes`)
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    console.log(`🎵 Audio decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`)
    
    // Get the first channel (mono)
    let audioData = audioBuffer.getChannelData(0)
    
    // Resample to 16kHz if needed
    if (audioBuffer.sampleRate !== 16000) {
      console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to 16000Hz...`)
      const resampleRatio = 16000 / audioBuffer.sampleRate
      const newLength = Math.floor(audioData.length * resampleRatio)
      const resampledData = new Float32Array(newLength)
      
      for (let i = 0; i < newLength; i++) {
        const originalIndex = i / resampleRatio
        const index = Math.floor(originalIndex)
        const fraction = originalIndex - index
        
        if (index + 1 < audioData.length) {
          resampledData[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction
        } else {
          resampledData[i] = audioData[index]
        }
      }
      
      audioData = resampledData
      console.log(`✅ Resampling completed: ${audioData.length} samples`)
    }
    
    console.log(`📏 Final audio data: ${audioData.length} samples (${(audioData.length / 16000).toFixed(2)}s)`)
    return audioData
    
  } finally {
    // Clean up audio context
    await audioContext.close()
  }
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  // Triple-check browser environment
  if (typeof window === 'undefined') {
    throw new Error('Transcription can only run in the browser')
  }
  
  console.log('🎤 Starting audio transcription...')
  console.log(`📊 Audio blob size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`)
  console.log('🔍 Audio blob type:', audioBlob.type)
  
  try {
    const recognizer = await getTranscriber()
    
    console.log('🔄 Running Whisper transcription...')
    const startTime = Date.now()
    
    // Process audio blob to Float32Array
    const audioData = await processAudioBlob(audioBlob)
    console.log('Transcribing full audio file...')
    
    // Configure Whisper for complete transcription
    const result = await recognizer(audioData, {
      // Force processing of the entire audio
      chunk_length_s: 30, // Process in 30-second chunks
      stride_length_s: 5,  // 5-second overlap between chunks
      return_timestamps: false, // We just want the text
      // Ensure we don't truncate early
      max_new_tokens: 1000, // Allow longer outputs
      temperature: 0.0, // Deterministic output
      do_sample: false, // Don't sample, use greedy decoding
      // Force complete processing
      forced_decoder_ids: null,
      suppress_tokens: null,
      begin_suppress_tokens: null,
    })
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    const transcriptText = result.text || ''
    console.log(`✅ Transcription completed in ${duration}s`)
    console.log(`📝 Full transcript length: ${transcriptText.length} characters`)
    console.log(`📝 Word count: ${transcriptText.split(/\s+/).filter(word => word.length > 0).length} words`)
    console.log(`📝 Transcript preview: "${transcriptText.substring(0, 200)}${transcriptText.length > 200 ? '...' : ''}"`)
    
    // Validate that we got a meaningful transcription
    if (transcriptText.length < 10) {
      console.warn('⚠️ Transcription seems unusually short, this might indicate an issue')
    }
    
    return transcriptText
  } catch (error) {
    console.error('❌ Transcription failed:', error)
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}