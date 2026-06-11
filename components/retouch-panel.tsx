"use client"

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from "react"
import { useState } from "react"

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void
  isLoading: boolean
}

const RetouchPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")

  const presets = [
    {
      name: "Blur Background",
      prompt:
        "Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.",
    },
    {
      name: "Enhance Details",
      prompt: "Slightly enhance the sharpness and details of the image without making it look unnatural.",
    },
    {
      name: "Warmer Lighting",
      prompt: "Adjust the color temperature to give the image warmer, golden-hour style lighting.",
    },
    { name: "Studio Light", prompt: "Add dramatic, professional studio lighting to the main subject." },
  ]

  const activePrompt = selectedPresetPrompt || customPrompt

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt)
    setCustomPrompt("")
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value)
    setSelectedPresetPrompt(null)
  }

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt)
    }
  }

  return (
    <div className="w-full bg-gray-800/90 border border-gray-700/50 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-sm shadow-elevated">
      <h3 className="text-lg font-semibold text-center text-gray-200">Professional Retouch</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? "ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500" : ""}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe a custom retouch (e.g., 'soften skin and brighten eyes')"
        className="flex-grow bg-gray-900/50 border border-gray-600/50 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base placeholder-gray-400"
        disabled={isLoading}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !activePrompt.trim()}
          >
            Apply Adjustment
          </button>
        </div>
      )}
    </div>
  )
}

export default RetouchPanel
