import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import type { PhotoItem, PageSettings, PageDimensions } from '~/types'
import {
  getPageDimensions,
  layoutPhotosIntoPages,
  pxToMm
} from '~/utils/page-layout'
import {
  loadImageElement,
  renderAdjustedCanvas
} from '~/utils/image-processing'

export interface ExportProgress {
  current: number
  total: number
  step: string
}

export async function exportSheetsToPdfBlob(
  photos: PhotoItem[],
  settings: PageSettings,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const avgAspect =
    photos.length > 0
      ? photos.reduce((acc, p) => acc + p.originalWidth / p.originalHeight, 0) / photos.length
      : 1

  const pageDims: PageDimensions = getPageDimensions(
    settings.pageSize,
    settings.orientation,
    settings.dpi,
    avgAspect
  )

  const pages = layoutPhotosIntoPages(
    photos,
    settings.photosPerPage,
    pageDims,
    settings.marginMm,
    8,
    settings.dpi
  )

  const pdf = new jsPDF({
    orientation: pageDims.isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageDims.widthMm, pageDims.heightMm]
  })

  let totalImages = 0
  pages.forEach(p => (totalImages += p.length))
  let processedCount = 0

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage(
        [pageDims.widthMm, pageDims.heightMm],
        pageDims.isLandscape ? 'landscape' : 'portrait'
      )
    }

    const items = pages[pageIdx]!
    for (const item of items) {
      processedCount++
      onProgress?.({
        current: processedCount,
        total: totalImages,
        step: `Rendering photo ${processedCount} of ${totalImages} on sheet ${pageIdx + 1}`
      })

      const img = await loadImageElement(item.photo.originalUrl)
      const canvas = renderAdjustedCanvas(
        img,
        item.photo.originalWidth,
        item.photo.originalHeight,
        item.photo.adjustments,
        item.photo.crop,
        item.renderWidth,
        item.renderHeight
      )

      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const xMm = pxToMm(item.renderX, settings.dpi)
      const yMm = pxToMm(item.renderY, settings.dpi)
      const wMm = pxToMm(item.renderWidth, settings.dpi)
      const hMm = pxToMm(item.renderHeight, settings.dpi)

      pdf.addImage(imgDataUrl, 'JPEG', xMm, yMm, wMm, hMm)
    }
  }

  return pdf.output('blob')
}

export async function exportIndividualPngs(
  photos: PhotoItem[],
  onProgress?: (progress: ExportProgress) => void
): Promise<Array<{ name: string; blob: Blob }>> {
  const results: Array<{ name: string; blob: Blob }> = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    onProgress?.({
      current: i + 1,
      total: photos.length,
      step: `Processing negative for ${photo.name}`
    })

    const img = await loadImageElement(photo.originalUrl)
    const canvas = renderAdjustedCanvas(
      img,
      photo.originalWidth,
      photo.originalHeight,
      photo.adjustments,
      photo.crop
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to generate PNG blob'))
      }, 'image/png')
    })

    const baseName = photo.name.replace(/\.[^/.]+$/, '')
    results.push({
      name: `${baseName}-negative.png`,
      blob
    })
  }

  return results
}

export async function saveFilesToUserSelection(
  files: Array<{ name: string; blob: Blob }>,
  onStatus?: (msg: string) => void
): Promise<{ method: 'directory' | 'zip' | 'single' }> {
  // Check if File System Access API is supported
  const hasDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  if (hasDirectoryPicker) {
    try {
      onStatus?.('Selecting destination folder...')
      const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()

      for (const file of files) {
        onStatus?.(`Writing ${file.name}...`)
        const fileHandle = await dirHandle.getFileHandle(file.name, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(file.blob)
        await writable.close()
      }

      onStatus?.('All files successfully saved to selected folder')
      return { method: 'directory' }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        throw err // User canceled picker
      }
      // If permission denied or unexpected error, fall back to ZIP
      console.warn('Directory picker failed, falling back to ZIP archive download:', err)
    }
  }

  // Fallback for Safari, Firefox, Mobile, or directory API failure
  if (files.length === 1) {
    onStatus?.('Downloading file...')
    const file = files[0]!
    triggerDirectDownload(file.blob, file.name)
    return { method: 'single' }
  }

  onStatus?.('Creating ZIP archive for download...')
  const zip = new JSZip()
  files.forEach((file) => {
    zip.file(file.name, file.blob)
  })

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDirectDownload(zipBlob, 'cyanotype-negatives.zip')
  onStatus?.('Archive downloaded successfully')
  return { method: 'zip' }
}

export function triggerDirectDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
