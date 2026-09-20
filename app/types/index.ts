export type PageSize = 'A3' | 'A4' | 'A5' | 'A6'

export type OrientationMode = 'auto' | 'portrait' | 'landscape'

export type PhotosPerPage = 1 | 2 | 3 | 4

export type AspectRatioOption = 'original' | 'square' | '2x3' | '4x3' | '16x9' | '1x2' | 'custom'

export interface CropBox {
  x: number // 0 to 1
  y: number // 0 to 1
  width: number // 0 to 1
  height: number // 0 to 1
}

export interface CropSettings {
  aspectRatio: AspectRatioOption
  customWidth: number
  customHeight: number
  box: CropBox
}

export interface ImageAdjustments {
  brightness: number
  contrast: number
  highlights: number
  shadows: number
}

export interface PhotoItem {
  id: string
  name: string
  file: File
  originalUrl: string
  previewUrl: string
  cyanotypeUrl?: string
  originalWidth: number
  originalHeight: number
  rotation: number // 0, 90, 180, 270
  adjustments: ImageAdjustments
  crop: CropSettings
  status: 'pending' | 'processing' | 'done' | 'error'
  errorMessage?: string
}

export type ImageFormat = 'png' | 'jpeg'

export interface PageSettings {
  pageSize: PageSize
  dpi: number
  photosPerPage: PhotosPerPage
  orientation: OrientationMode
  marginMm: number
  imageFormat: ImageFormat
  jpegQuality: number
}

export interface PageDimensions {
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  isLandscape: boolean
}

export interface CellSlot {
  cellX: number
  cellY: number
  cellWidth: number
  cellHeight: number
}

export interface PlacedImage {
  photo: PhotoItem
  slot: CellSlot
  renderX: number
  renderY: number
  renderWidth: number
  renderHeight: number
  autoRotated90: boolean
}
