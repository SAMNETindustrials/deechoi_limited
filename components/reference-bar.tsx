"use client"

import { useEditorStore } from "@/lib/store/editor-store"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ReferenceBar() {
  const { referenceImages, removeFromReference } = useEditorStore()

  if (referenceImages.length === 0) {
    return null
  }

  return (
    <div className="h-24 bg-zinc-900 border-t border-border/50 flex items-center px-4 space-x-3 overflow-x-auto">
      <div className="text-sm text-gray-400 whitespace-nowrap">Reference Images:</div>

      <div className="flex space-x-3">
        {referenceImages.map((image) => (
          <div key={image.id} className="relative group flex-shrink-0">
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.prompt}
              className="w-16 h-16 object-cover rounded-lg border border-border/50"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeFromReference(image.id)}
            >
              <X className="w-3 h-3" />
            </Button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
              {image.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
