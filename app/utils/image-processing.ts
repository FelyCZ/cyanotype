import type { ImageAdjustments, CropSettings, AspectRatioOption } from '~/types'

export function clamp(val: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, val))
}

export function createDefaultAdjustments(): ImageAdjustments {
  return {
    brightness: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0
  }
}

export function createDefaultCrop(): CropSettings {
  return {
    aspectRatio: 'original',
    customWidth: 1,
    customHeight: 1,
    panX: 0.5,
    panY: 0.5
  }
}

export function getCropRect(
  sourceWidth: number,
  sourceHeight: number,
  crop: CropSettings
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  if (crop.aspectRatio === 'original') {
    return { sx: 0, sy: 0, sWidth: sourceWidth, sHeight: sourceHeight }
  }

  let ratio = 1
  const isSourceLandscape = sourceWidth >= sourceHeight

  switch (crop.aspectRatio) {
    case 'square':
      ratio = 1
      break
    case '2x3':
      ratio = isSourceLandscape ? 3 / 2 : 2 / 3
      break
    case '4x3':
      ratio = isSourceLandscape ? 4 / 3 : 3 / 4
      break
    case '16x9':
      ratio = isSourceLandscape ? 16 / 9 : 9 / 16
      break
    case '1x2':
      ratio = isSourceLandscape ? 2 / 1 : 1 / 2
      break
    case 'custom':
      ratio = Math.max(0.01, crop.customWidth) / Math.max(0.01, crop.customHeight)
      break
  }

  const imgRatio = sourceWidth / sourceHeight

  if (imgRatio > ratio) {
    const sHeight = sourceHeight
    const sWidth = Math.round(sourceHeight * ratio)
    const maxOffset = sourceWidth - sWidth
    const clampedPan = Math.max(0, Math.min(1, crop.panX))
    const sx = Math.round(maxOffset * clampedPan)
    const sy = 0
    return { sx, sy, sWidth, sHeight }
  } else {
    const sWidth = sourceWidth
    const sHeight = Math.round(sourceWidth / ratio)
    const maxOffset = sourceHeight - sHeight
    const clampedPan = Math.max(0, Math.min(1, crop.panY))
    const sx = 0
    const sy = Math.round(maxOffset * clampedPan)
    return { sx, sy, sWidth, sHeight }
  }
}

export function processImageData(imageData: ImageData, adjustments: ImageAdjustments): ImageData {
  const data = imageData.data
  const len = data.length

  const brightnessShift = adjustments.brightness * 2.55
  const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast))
  const shadowsFactor = adjustments.shadows * 1.28
  const highlightsFactor = adjustments.highlights * 1.28

  for (let i = 0; i < len; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!

    // Normalized initial luminance
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

    // Shadows affect lower luminance bracket
    let shadowShift = 0
    if (lum < 0.5) {
      const w = 1 - 2 * lum
      shadowShift = shadowsFactor * (w * w)
    }

    // Highlights affect upper luminance bracket
    let highlightShift = 0
    if (lum > 0.5) {
      const w = 2 * lum - 1
      highlightShift = highlightsFactor * (w * w)
    }

    const toneShift = shadowShift + highlightShift

    // Apply tone adjustments to positive image
    const adjR = contrastFactor * (r + toneShift - 128) + 128 + brightnessShift
    const adjG = contrastFactor * (g + toneShift - 128) + 128 + brightnessShift
    const adjB = contrastFactor * (b + toneShift - 128) + 128 + brightnessShift

    const clampedR = clamp(adjR)
    const clampedG = clamp(adjG)
    const clampedB = clamp(adjB)

    // Convert positive to grayscale via Rec. 709 luminance
    const gray = 0.2126 * clampedR + 0.7152 * clampedG + 0.0722 * clampedB

    // Invert to negative
    const inverted = clamp(255 - gray)

    data[i] = inverted
    data[i + 1] = inverted
    data[i + 2] = inverted
    data[i + 3] = 255
  }

  return imageData
}

export function renderAdjustedCanvas(
  sourceImage: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  adjustments: ImageAdjustments,
  crop?: CropSettings,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const cropSettings = crop || createDefaultCrop()
  const { sx, sy, sWidth, sHeight } = getCropRect(sourceWidth, sourceHeight, cropSettings)

  const width = Math.round(targetWidth || sWidth)
  const height = Math.round(targetHeight || sHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Could not get 2D canvas context')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceImage, sx, sy, sWidth, sHeight, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  processImageData(imageData, adjustments)
  ctx.putImageData(imageData, 0, 0)

  return canvas
}

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export async function createThumbnailFromImage(
  img: HTMLImageElement,
  adjustments: ImageAdjustments,
  crop?: CropSettings,
  maxDimension = 640
): Promise<{ previewUrl: string; width: number; height: number }> {
  const originalWidth = img.naturalWidth || img.width
  const originalHeight = img.naturalHeight || img.height

  const cropSettings = crop || createDefaultCrop()
  const { sWidth, sHeight } = getCropRect(originalWidth, originalHeight, cropSettings)

  let targetWidth = sWidth
  let targetHeight = sHeight

  if (sWidth > maxDimension || sHeight > maxDimension) {
    if (sWidth >= sHeight) {
      targetWidth = maxDimension
      targetHeight = Math.round((sHeight / sWidth) * maxDimension)
    } else {
      targetHeight = maxDimension
      targetWidth = Math.round((sWidth / sHeight) * maxDimension)
    }
  }

  const canvas = renderAdjustedCanvas(
    img,
    originalWidth,
    originalHeight,
    adjustments,
    cropSettings,
    targetWidth,
    targetHeight
  )

  const previewUrl = canvas.toDataURL('image/jpeg', 0.88)
  return {
    previewUrl,
    width: sWidth,
    height: sHeight
  }
}
