import type { ImageAdjustments, CropSettings, CropBox, AspectRatioOption } from '~/types'

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

export function createDefaultCropBox(): CropBox {
  return {
    x: 0,
    y: 0,
    width: 1,
    height: 1
  }
}

export function createDefaultCrop(): CropSettings {
  return {
    aspectRatio: 'original',
    customWidth: 1,
    customHeight: 1,
    box: createDefaultCropBox()
  }
}

export function getNumericRatio(
  aspectRatio: AspectRatioOption,
  isLandscape: boolean,
  customWidth = 1,
  customHeight = 1
): number | null {
  switch (aspectRatio) {
    case 'original':
      return null
    case 'square':
      return 1
    case '2x3':
      return isLandscape ? 3 / 2 : 2 / 3
    case '4x3':
      return isLandscape ? 4 / 3 : 3 / 4
    case '16x9':
      return isLandscape ? 16 / 9 : 9 / 16
    case '1x2':
      return isLandscape ? 2 / 1 : 1 / 2
    case 'custom':
      return Math.max(0.01, customWidth) / Math.max(0.01, customHeight)
  }
}

export function calculateInitialCropBox(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: AspectRatioOption,
  customWidth = 1,
  customHeight = 1
): CropBox {
  if (aspectRatio === 'original') {
    return createDefaultCropBox()
  }

  const isLandscape = imageWidth >= imageHeight
  const targetRatio = getNumericRatio(aspectRatio, isLandscape, customWidth, customHeight)
  if (!targetRatio) return createDefaultCropBox()

  const currentRatio = imageWidth / imageHeight

  if (currentRatio > targetRatio) {
    // Image is wider than target ratio
    const boxWidth = (imageHeight * targetRatio) / imageWidth
    const boxX = (1 - boxWidth) / 2
    return {
      x: boxX,
      y: 0,
      width: boxWidth,
      height: 1
    }
  } else {
    // Image is taller than target ratio
    const boxHeight = imageWidth / targetRatio / imageHeight
    const boxY = (1 - boxHeight) / 2
    return {
      x: 0,
      y: boxY,
      width: 1,
      height: boxHeight
    }
  }
}

export function getRotatedCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  rotation: number
): HTMLCanvasElement {
  const normRot = ((rotation % 360) + 360) % 360
  if (normRot === 0) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(source, 0, 0, width, height)
    return canvas
  }

  const isSwap = normRot === 90 || normRot === 270
  const rotW = isSwap ? height : width
  const rotH = isSwap ? width : height

  const canvas = document.createElement('canvas')
  canvas.width = rotW
  canvas.height = rotH
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.translate(rotW / 2, rotH / 2)
  ctx.rotate((normRot * Math.PI) / 180)
  ctx.drawImage(source, -width / 2, -height / 2, width, height)

  return canvas
}

export type ToneRenderMode = 'negative' | 'cyanotype'

export function processImageData(
  imageData: ImageData,
  adjustments: ImageAdjustments,
  mode: ToneRenderMode = 'negative'
): ImageData {
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

    if (mode === 'cyanotype') {
      // Invert negative back to positive print in Persian blue
      // Persian blue deep shadow: rgb(28, 57, 187)
      // Paper highlight: rgb(250, 248, 244)
      const normLum = gray / 255
      data[i] = Math.round(28 + normLum * (250 - 28))
      data[i + 1] = Math.round(57 + normLum * (248 - 57))
      data[i + 2] = Math.round(187 + normLum * (244 - 187))
      data[i + 3] = 255
    } else {
      // Invert to negative
      const inverted = clamp(255 - gray)
      data[i] = inverted
      data[i + 1] = inverted
      data[i + 2] = inverted
      data[i + 3] = 255
    }
  }

  return imageData
}

export function renderAdjustedCanvas(
  sourceImage: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rotation: number,
  adjustments: ImageAdjustments,
  crop?: CropSettings,
  targetWidth?: number,
  targetHeight?: number,
  mode: ToneRenderMode = 'negative'
): HTMLCanvasElement {
  const rotatedCanvas = getRotatedCanvas(sourceImage, sourceWidth, sourceHeight, rotation)
  const rotW = rotatedCanvas.width
  const rotH = rotatedCanvas.height

  const cropSettings = crop || createDefaultCrop()
  const box = cropSettings.box || createDefaultCropBox()

  const sx = Math.max(0, Math.min(rotW - 1, Math.round(box.x * rotW)))
  const sy = Math.max(0, Math.min(rotH - 1, Math.round(box.y * rotH)))
  const sWidth = Math.max(1, Math.min(rotW - sx, Math.round(box.width * rotW)))
  const sHeight = Math.max(1, Math.min(rotH - sy, Math.round(box.height * rotH)))

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
  ctx.drawImage(rotatedCanvas, sx, sy, sWidth, sHeight, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  processImageData(imageData, adjustments, mode)
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
  rotation = 0,
  adjustments: ImageAdjustments,
  crop?: CropSettings,
  maxDimension = 640,
  mode: ToneRenderMode = 'negative'
): Promise<{ previewUrl: string; width: number; height: number }> {
  const originalWidth = img.naturalWidth || img.width
  const originalHeight = img.naturalHeight || img.height

  const isSwap = ((rotation % 360) + 360) % 360 === 90 || ((rotation % 360) + 360) % 360 === 270
  const rotW = isSwap ? originalHeight : originalWidth
  const rotH = isSwap ? originalWidth : originalHeight

  const cropSettings = crop || createDefaultCrop()
  const box = cropSettings.box || createDefaultCropBox()

  const sWidth = Math.max(1, Math.round(box.width * rotW))
  const sHeight = Math.max(1, Math.round(box.height * rotH))

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
    rotation,
    adjustments,
    cropSettings,
    targetWidth,
    targetHeight,
    mode
  )

  const previewUrl = canvas.toDataURL('image/jpeg', 0.88)
  return {
    previewUrl,
    width: sWidth,
    height: sHeight
  }
}
