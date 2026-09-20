import type {
  PageSize,
  OrientationMode,
  PhotosPerPage,
  PageDimensions,
  CellSlot,
  PlacedImage,
  PhotoItem
} from '~/types'

export const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number }> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 }
}

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

export function pxToMm(px: number, dpi: number): number {
  return (px * 25.4) / dpi
}

export function getPageDimensions(
  pageSize: PageSize,
  orientation: OrientationMode,
  dpi: number,
  aspectRatioHint = 1
): PageDimensions {
  const base = PAGE_SIZES_MM[pageSize]

  let isLandscape: boolean
  if (orientation === 'portrait') {
    isLandscape = false
  } else if (orientation === 'landscape') {
    isLandscape = true
  } else {
    // Auto mode: choose orientation matching image aspect ratio
    isLandscape = aspectRatioHint > 1
  }

  const widthMm = isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height)
  const heightMm = isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height)

  const widthPx = mmToPx(widthMm, dpi)
  const heightPx = mmToPx(heightMm, dpi)

  return {
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    isLandscape
  }
}

export function calculateGridCells(
  pageWidthPx: number,
  pageHeightPx: number,
  count: PhotosPerPage,
  marginMm: number,
  gutterMm: number,
  dpi: number
): CellSlot[] {
  const marginPx = mmToPx(marginMm, dpi)
  const gutterPx = mmToPx(gutterMm, dpi)

  const availableWidth = pageWidthPx - marginPx * 2
  const availableHeight = pageHeightPx - marginPx * 2

  if (availableWidth <= 0 || availableHeight <= 0) {
    return [{ cellX: 0, cellY: 0, cellWidth: pageWidthPx, cellHeight: pageHeightPx }]
  }

  if (count === 1) {
    return [
      {
        cellX: marginPx,
        cellY: marginPx,
        cellWidth: availableWidth,
        cellHeight: availableHeight
      }
    ]
  }

  if (count === 2) {
    const isPageLandscape = availableWidth >= availableHeight
    if (isPageLandscape) {
      // 2 columns, 1 row
      const cellWidth = Math.floor((availableWidth - gutterPx) / 2)
      return [
        { cellX: marginPx, cellY: marginPx, cellWidth, cellHeight: availableHeight },
        { cellX: marginPx + cellWidth + gutterPx, cellY: marginPx, cellWidth, cellHeight: availableHeight }
      ]
    } else {
      // 1 column, 2 rows
      const cellHeight = Math.floor((availableHeight - gutterPx) / 2)
      return [
        { cellX: marginPx, cellY: marginPx, cellWidth: availableWidth, cellHeight },
        { cellX: marginPx, cellY: marginPx + cellHeight + gutterPx, cellWidth: availableWidth, cellHeight }
      ]
    }
  }

  if (count === 3) {
    const isPageLandscape = availableWidth >= availableHeight
    if (isPageLandscape) {
      // 3 columns, 1 row
      const cellWidth = Math.floor((availableWidth - gutterPx * 2) / 3)
      return [
        { cellX: marginPx, cellY: marginPx, cellWidth, cellHeight: availableHeight },
        { cellX: marginPx + cellWidth + gutterPx, cellY: marginPx, cellWidth, cellHeight: availableHeight },
        { cellX: marginPx + (cellWidth + gutterPx) * 2, cellY: marginPx, cellWidth, cellHeight: availableHeight }
      ]
    } else {
      // 1 column, 3 rows
      const cellHeight = Math.floor((availableHeight - gutterPx * 2) / 3)
      return [
        { cellX: marginPx, cellY: marginPx, cellWidth: availableWidth, cellHeight },
        { cellX: marginPx, cellY: marginPx + cellHeight + gutterPx, cellWidth: availableWidth, cellHeight },
        { cellX: marginPx, cellY: marginPx + (cellHeight + gutterPx) * 2, cellWidth: availableWidth, cellHeight }
      ]
    }
  }

  // count === 4: 2 columns, 2 rows
  const cellWidth = Math.floor((availableWidth - gutterPx) / 2)
  const cellHeight = Math.floor((availableHeight - gutterPx) / 2)

  return [
    { cellX: marginPx, cellY: marginPx, cellWidth, cellHeight },
    { cellX: marginPx + cellWidth + gutterPx, cellY: marginPx, cellWidth, cellHeight },
    { cellX: marginPx, cellY: marginPx + cellHeight + gutterPx, cellWidth, cellHeight },
    { cellX: marginPx + cellWidth + gutterPx, cellY: marginPx + cellHeight + gutterPx, cellWidth, cellHeight }
  ]
}

export function calculateFitPlacement(
  imgWidth: number,
  imgHeight: number,
  slot: CellSlot
): { renderX: number; renderY: number; renderWidth: number; renderHeight: number } {
  const scale = Math.min(slot.cellWidth / imgWidth, slot.cellHeight / imgHeight)
  const renderWidth = Math.round(imgWidth * scale)
  const renderHeight = Math.round(imgHeight * scale)

  const renderX = Math.round(slot.cellX + (slot.cellWidth - renderWidth) / 2)
  const renderY = Math.round(slot.cellY + (slot.cellHeight - renderHeight) / 2)

  return {
    renderX,
    renderY,
    renderWidth,
    renderHeight
  }
}

export function layoutPhotosIntoPages(
  photos: PhotoItem[],
  perPage: PhotosPerPage,
  pageDims: PageDimensions,
  autoOrientation = false,
  marginMm = 10,
  gutterMm = 8,
  dpi = 300
): PlacedImage[][] {
  const pages: PlacedImage[][] = []
  const cells = calculateGridCells(pageDims.widthPx, pageDims.heightPx, perPage, marginMm, gutterMm, dpi)

  for (let i = 0; i < photos.length; i += perPage) {
    const chunk = photos.slice(i, i + perPage)
    const pageItems: PlacedImage[] = []

    chunk.forEach((photo, idx) => {
      const slot = cells[idx]
      if (!slot) return

      const isManualSwap = ((photo.rotation % 360) + 360) % 360 === 90 || ((photo.rotation % 360) + 360) % 360 === 270
      const baseW = isManualSwap ? photo.originalHeight : photo.originalWidth
      const baseH = isManualSwap ? photo.originalWidth : photo.originalHeight

      const box = photo.crop?.box || { x: 0, y: 0, width: 1, height: 1 }
      const imgW = Math.max(1, Math.round(box.width * baseW))
      const imgH = Math.max(1, Math.round(box.height * baseH))

      let autoRotated90 = false
      let effectiveW = imgW
      let effectiveH = imgH

      if (autoOrientation) {
        const scaleNormal = Math.min(slot.cellWidth / imgW, slot.cellHeight / imgH)
        const areaNormal = (imgW * scaleNormal) * (imgH * scaleNormal)

        const scaleRotated = Math.min(slot.cellWidth / imgH, slot.cellHeight / imgW)
        const areaRotated = (imgH * scaleRotated) * (imgW * scaleRotated)

        // Rotate by 90 if it uses at least 15% more printable area in the cell
        if (areaRotated > areaNormal * 1.15) {
          autoRotated90 = true
          effectiveW = imgH
          effectiveH = imgW
        }
      }

      const placement = calculateFitPlacement(effectiveW, effectiveH, slot)
      pageItems.push({
        photo,
        slot,
        autoRotated90,
        ...placement
      })
    })

    pages.push(pageItems)
  }

  return pages
}
