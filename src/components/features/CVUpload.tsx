'use client'

import React, { useState, useCallback, useRef, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button, Progress } from '@/components/ui'
import { ErrorBoundary, useError } from '@/components/error'

interface CVUploadProps {
  onFileSelect: (file: File) => void
  onUploadComplete?: (result: { fileName: string; size: number; type: string; success: boolean }) => void
  maxFileSize?: number
  acceptedTypes?: string[]
  className?: string
}

interface UploadState {
  isDragOver: boolean
  isUploading: boolean
  progress: number
  error: string | null
  file: File | null
}

const CVUpload = memo(function CVUpload({
  onFileSelect,
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  className
}: CVUploadProps) {
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    progress: 0,
    error: null,
    file: null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { reportError } = useError()

  const validateFile = useCallback((file: File): string | null => {
    try {
      // Check file size
      if (file.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedTypes.includes(fileExtension)) {
        return `File type must be one of: ${acceptedTypes.join(', ')}`
      }

      return null
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('File validation failed'), {
        component: 'CVUpload',
        action: 'validateFile',
        fileName: file.name,
        fileSize: file.size
      })
      return 'File validation failed. Please try again.'
    }
  }, [maxFileSize, acceptedTypes, reportError])

  const simulateUpload = useCallback(async (file: File) => {
    try {
      setState(prev => ({ ...prev, isUploading: true, progress: 0 }))

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setState(prev => ({ ...prev, progress: i }))
      }

      // Simulate processing
      setState(prev => ({ ...prev, progress: 100 }))
      
      setTimeout(() => {
        setState(prev => ({ ...prev, isUploading: false }))
        onUploadComplete?.({ 
          fileName: file.name,
          size: file.size,
          type: file.type,
          success: true
        })
      }, 500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ ...prev, error: errorMessage, isUploading: false }))
      
      // Report error to global error handler
      reportError(error instanceof Error ? error : new Error(errorMessage), {
        component: 'CVUpload',
        action: 'simulateUpload',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      onUploadComplete?.({
        fileName: file.name,
        size: file.size,
        type: file.type,
        success: false
      })
    }
  }, [onUploadComplete, reportError])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    
    if (error) {
      setState(prev => ({ ...prev, error, file: null }))
      return
    }

    setState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      progress: 0
    }))

    onFileSelect(file)
    void simulateUpload(file)
  }, [validateFile, onFileSelect, simulateUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setState(prev => ({ ...prev, isDragOver: false }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragOver: false }))

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      file: null, 
      error: null, 
      progress: 0,
      isUploading: false 
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const maxFileSizeMB = useMemo(() => Math.round(maxFileSize / (1024 * 1024)), [maxFileSize])
  const acceptedTypesString = useMemo(() => acceptedTypes.join(', '), [acceptedTypes])

  return (
    <ErrorBoundary
      level="feature"
      onError={(error, errorInfo) => {
        reportError(error, {
          component: 'CVUpload',
          errorInfo
        })
      }}
    >
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300',
          'hover:border-primary/50 hover:bg-primary/5',
          state.isDragOver && 'border-primary bg-primary/10 scale-105',
          state.error && 'border-error/50 bg-error/5',
          !state.file && 'cursor-pointer',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface-900'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!state.file ? handleClick : undefined}
        role="button"
        tabIndex={0}
        aria-label="Upload CV file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="sr-only"
          disabled={state.isUploading}
        />

        {!state.file ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload your CV
              </h3>
              <p className="text-white/60 mb-4">
                Drag and drop your CV here, or click to browse
              </p>
              <p className="text-sm text-white/40">
                Supports {acceptedTypesString} up to {maxFileSizeMB}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-white truncate max-w-xs">
                    {state.file.name}
                  </p>
                  <p className="text-sm text-white/60">
                    {formatFileSize(state.file.size)}
                  </p>
                </div>
              </div>
              
              {!state.isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  aria-label="Remove file"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {state.isUploading && (
              <div className="space-y-2">
                <Progress
                  value={state.progress}
                  showLabel
                  label="Uploading..."
                />
                <p className="text-sm text-white/60 text-center">
                  Processing your CV...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-error flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-error text-sm">{state.error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state.file && !state.isUploading && !state.error && (
        <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-success flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-success text-sm">
              CV uploaded successfully! We&apos;ll extract your information automatically.
            </p>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
})

CVUpload.displayName = 'CVUpload'

export default CVUpload