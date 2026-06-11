"use client"

import type React from "react"
import { CropIcon, MousePointerClick, ImageUp, Pipette, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Undo2, Redo2 } from "lucide-react"
import { useState, useRef } from "react"

interface EditorPromptBarProps {
  onImagesGenerated?: (hasImages: boolean) => void
}

export function EditorPromptBar({ onImagesGenerated }: EditorPromptBarProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{ base64: string; mediaType: string }>>([])
  const [hasImages, setHasImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
        setHasImages(true)
        onImagesGenerated?.(true)
      }

      setPrompt("")
    } catch (error) {
      console.error("[v0] Error generating image:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      const base64Data = base64String.split(",")[1]
      const mediaType = file.type

      setGeneratedImages([{ base64: base64Data, mediaType }])
      setHasImages(true)
      onImagesGenerated?.(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center px-6">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {generatedImages.length > 0 && (
        <div className="mb-8 grid gap-4 image-zoom-in">
          {generatedImages.map((img, idx) => (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden border border-zinc-700 w-full max-w-4xl max-h-[300px]"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                src={`data:${img.mediaType};base64,${img.base64}`}
                alt={`Generated image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div
        className={`w-[600px] p-4 shadow-elevated bg-zinc-900/80 backdrop-blur-[10px] border border-gray-600/30 relative rounded-3xl py-4 pt-3 ${hasImages ? "prompt-slide-down" : ""}`}
        style={{ transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                disabled
                className="h-8 px-2 text-gray-400 disabled:opacity-50 hover:bg-transparent"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled
                className="h-8 px-2 text-gray-400 disabled:opacity-50 hover:bg-transparent"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white hover:bg-transparent hover:text-white"
                title="Upload image"
                onClick={handleUploadClick}
              >
                <ImageUp className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white hover:bg-transparent hover:text-white"
                title="Pipette"
              >
                <Pipette className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white hover:bg-transparent hover:text-white"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white hover:bg-transparent hover:text-white"
                title="Crop and download image"
              >
                <CropIcon className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white hover:bg-transparent hover:text-white"
                title="Toggle retouch mode"
              >
                <MousePointerClick className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="relative">
                {isGenerating && <div className="absolute -inset-[2px] rounded-2xl input-background-gradient" />}

                <div className="rounded-2xl p-3 flex items-center space-x-3 relative border-zinc-700 border-[0.5px] px-2 py-2 bg-zinc-800">
                  <div className="flex-1">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isGenerating ? "Generating..." : "Describe your image..."}
                      className={`min-h-[40px] max-h-32 resize-none border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isGenerating ? "gradient-text-animated" : prompt.trim() ? "text-white" : "text-gray-400"
                      }`}
                      rows={1}
                      disabled={isGenerating}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || isGenerating}
                    className="h-8 px-3 flex-shrink-0 rounded-full"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-background-gradient {
          background: linear-gradient(45deg, 
            rgba(59, 130, 246, 0.8) 0%,
            rgba(139, 92, 246, 0.8) 25%,
            rgba(6, 182, 212, 0.8) 50%,
            rgba(245, 158, 11, 0.8) 75%,
            rgba(59, 130, 246, 0.8) 100%
          );
          background-size: 400% 400%;
          animation: gradient-rotate 3s ease-in-out infinite;
          z-index: 0;
        }
        
        .gradient-text-animated {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.6) 20%,
            rgba(255, 255, 255, 0.9) 40%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 255, 255, 0.9) 60%,
            rgba(255, 255, 255, 0.6) 80%,
            rgba(255, 255, 255, 0.3) 100%
          );
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-text-flow-rtl 2s linear infinite;
        }
        
        @keyframes gradient-text-flow-rtl {
          0% {
            background-position: 300% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes gradient-rotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .image-zoom-in {
          animation: image-appear 0.8s cubic-bezier(0.87, 0, 0.13, 1) forwards;
        }
        
        @keyframes image-appear {
          0% {
            opacity: 0;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .prompt-slide-down {
          transform: translateY(120px);
        }
      `}</style>
    </div>
  )
}
