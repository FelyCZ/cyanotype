export type PageSize = 'A3' | 'A4' | 'A5' | 'A6'

export type OrientationMode = 'auto' | 'portrait' | 'landscape'

export type OutputMode = 'sheets' | 'individual'

export type PhotosPerPage = 1 | 2 | 3 | 4

export interface ImageAdjustments {
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  highlights: number // -100 to 100
  shadows: number // -100 to 100
}

export interface PhotoItem {
  id: string
  name: string
  file: File
  originalUrl: string
  previewUrl: string
  originalWidth: number
  originalHeight: number
  adjustments: ImageAdjustments
  status: 'pending' | 'processing' | 'done' | 'error'
  errorMessage?: string
}

export interface PageSettings {
  pageSize: PageSize
  dpi: number
  photosPerPage: PhotosPerPage
  orientation: OrientationMode
  outputMode: OutputMode
  marginMm: number
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
}
