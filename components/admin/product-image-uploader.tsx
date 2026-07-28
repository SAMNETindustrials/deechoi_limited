'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function ProductImageUploader({ value, onChange, label = 'Product Image' }: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    try {
      setIsUploading(true)
      
      // Convert to Base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        onChange(base64String)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      
      {value ? (
        <div className="relative w-full bg-accent/5 rounded-lg overflow-hidden border-2 border-dashed border-border">
          <img src={value} alt="Product preview" className="w-full h-64 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 rounded-lg text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-2 left-2"
            onClick={() => fileInputRef.current?.click()}
          >
            Change Image
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-accent/5 hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-primary/10 rounded-lg">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isUploading ? 'Uploading...' : 'Drag or click to upload image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or GIF (max 5MB)</p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}
