import type { ImageAdjustments } from '~/types'

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
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const width = Math.round(targetWidth || sourceWidth)
  const height = Math.round(targetHeight || sourceHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Could not get 2D canvas context')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceImage, 0, 0, width, height)

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
  maxDimension = 640
): Promise<{ previewUrl: string; width: number; height: number }> {
  const originalWidth = img.naturalWidth || img.width
  const originalHeight = img.naturalHeight || img.height

  let targetWidth = originalWidth
  let targetHeight = originalHeight

  if (originalWidth > maxDimension || originalHeight > maxDimension) {
    if (originalWidth >= originalHeight) {
      targetWidth = maxDimension
      targetHeight = Math.round((originalHeight / originalWidth) * maxDimension)
    } else {
      targetHeight = maxDimension
      targetWidth = Math.round((originalWidth / originalHeight) * maxDimension)
    }
  }

  const canvas = renderAdjustedCanvas(
    img,
    originalWidth,
    originalHeight,
    adjustments,
    targetWidth,
    targetHeight
  )

  const previewUrl = canvas.toDataURL('image/jpeg', 0.88)
  return {
    previewUrl,
    width: originalWidth,
    height: originalHeight
  }
}
