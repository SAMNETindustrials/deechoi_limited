import { create } from "zustand"

export type Tool = "move" | "mask" | "lasso" | "magic" | "retouch" | "swap" | "remove" | "compare"

interface ImageData {
  id: string
  url: string
  originalUrl?: string
  prompt: string
  x: number
  y: number
  width: number
  height: number
}

interface ReferenceImage {
  id: string
  url: string
  prompt: string
}

interface RetouchObject {
  id: string
  url: string
  name: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
  aspectRatio?: number
}

interface EditorState {
  activeTool: Tool
  setActiveTool: (tool: Tool) => void
  isGenerating: boolean
  setGenerating: (generating: boolean) => void
  images: ImageData[]
  addImage: (image: Omit<ImageData, "id">) => void
  updateImage: (id: string, updates: Partial<ImageData>) => void
  removeImage: (id: string) => void
  selectedImageId: string | null
  setSelectedImageId: (id: string | null) => void
  canvasSize: { width: number; height: number }
  setCanvasSize: (size: { width: number; height: number }) => void
  referenceImages: ReferenceImage[]
  addToReference: (image: Omit<ReferenceImage, "id">) => void
  removeFromReference: (id: string) => void
  clearReference: () => void
  retouchObjects: RetouchObject[]
  addRetouchObject: (object: Omit<RetouchObject, "id">) => void
  removeRetouchObject: (id: string) => void
  clearRetouchObjects: () => void
  editHotspot: { x: number; y: number } | null
  setEditHotspot: (hotspot: { x: number; y: number } | null) => void
  displayHotspot: { x: number; y: number } | null
  setDisplayHotspot: (hotspot: { x: number; y: number } | null) => void
  history: ImageData[][]
  currentHistoryIndex: number
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  isCropping: boolean
  setCropping: (cropping: boolean) => void
  cropArea: CropArea | null
  setCropArea: (area: CropArea | null) => void
  selectedAspectRatio: number | null
  setSelectedAspectRatio: (ratio: number | null) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: "move",
  setActiveTool: (tool) => set({ activeTool: tool }),
  isGenerating: false,
  setGenerating: (generating) => set({ isGenerating: generating }),
  images: [],
  addImage: (image) =>
    set((state) => ({
      images: [...state.images, { ...image, id: crypto.randomUUID() }],
    })),
  updateImage: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    })),
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
    })),
  selectedImageId: null,
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  canvasSize: { width: 10000, height: 10000 },
  setCanvasSize: (size) => set({ canvasSize: size }),
  referenceImages: [],
  addToReference: (image) =>
    set((state) => ({
      referenceImages: [...state.referenceImages, { ...image, id: crypto.randomUUID() }],
    })),
  removeFromReference: (id) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((img) => img.id !== id),
    })),
  clearReference: () => set({ referenceImages: [] }),
  retouchObjects: [],
  addRetouchObject: (object) =>
    set((state) => ({
      retouchObjects: [...state.retouchObjects, { ...object, id: crypto.randomUUID() }],
    })),
  removeRetouchObject: (id) =>
    set((state) => ({
      retouchObjects: state.retouchObjects.filter((obj) => obj.id !== id),
    })),
  clearRetouchObjects: () => set({ retouchObjects: [] }),
  editHotspot: null,
  setEditHotspot: (hotspot) => set({ editHotspot: hotspot }),
  displayHotspot: null,
  setDisplayHotspot: (hotspot) => set({ displayHotspot: hotspot }),
  history: [[]],
  currentHistoryIndex: 0,
  saveToHistory: () => {
    const state = get()
    const newHistory = state.history.slice(0, state.currentHistoryIndex + 1)
    newHistory.push([...state.images])
    set({
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    })
  },
  undo: () => {
    const state = get()
    if (state.canUndo()) {
      const newIndex = state.currentHistoryIndex - 1
      set({
        images: [...state.history[newIndex]],
        currentHistoryIndex: newIndex,
      })
    }
  },
  redo: () => {
    const state = get()
    if (state.canRedo()) {
      const newIndex = state.currentHistoryIndex + 1
      set({
        images: [...state.history[newIndex]],
        currentHistoryIndex: newIndex,
      })
    }
  },
  canUndo: () => {
    const state = get()
    return state.currentHistoryIndex > 0
  },
  canRedo: () => {
    const state = get()
    return state.currentHistoryIndex < state.history.length - 1
  },
  isCropping: false,
  setCropping: (cropping) => set({ isCropping: cropping }),
  cropArea: null,
  setCropArea: (area) => set({ cropArea: area }),
  selectedAspectRatio: null,
  setSelectedAspectRatio: (ratio) => set({ selectedAspectRatio: ratio }),
}))
