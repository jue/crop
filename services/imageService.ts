import JSZip from 'jszip'
import saveAs from 'file-saver'
import { GridConfig } from '../types'

/**
 * Loads a file object into an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Slices an image into a grid and returns a ZIP blob
 */
export const processAndZipImage = async (
  file: File,
  config: GridConfig,
  imagePosition?: { x: number; y: number },
  imageSizes?: {
    naturalWidth: number
    naturalHeight: number
    displayWidth: number
    displayHeight: number
  } | null,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const { rows, cols } = config
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get 2D context')
  }

  // Calculate dimensions for each slice
  const sliceWidth = img.naturalWidth / cols
  const sliceHeight = img.naturalHeight / rows

  const zip = new JSZip()
  const folder = zip.folder('stickers')

  if (!folder) throw new Error('Failed to create zip folder')

  let processedCount = 0
  const totalCount = rows * cols

  // Iterate through grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Resize canvas for this specific slice
      canvas.width = sliceWidth
      canvas.height = sliceHeight

      // Clear canvas
      ctx.clearRect(0, 0, sliceWidth, sliceHeight)

      // 计算位置偏移比例 - 需要考虑预览中的位置如何映射到原始图片
      // 预览中的位置是像素值，需要转换为相对于原始图片的比例
      const positionOffset = imagePosition || { x: 0, y: 0 }

      // 计算实际的源图像偏移 - 使用从前端传递的精确图片尺寸信息
      let sourceXOffset = 0
      let sourceYOffset = 0

      if (positionOffset && imageSizes) {
        // 使用精确的缩放比例计算：原始尺寸 / 显示尺寸
        const scaleX = imageSizes.naturalWidth / imageSizes.displayWidth
        const scaleY = imageSizes.naturalHeight / imageSizes.displayHeight

        // 计算源图像的偏移量
        // 负号是因为在预览中拖动方向与实际需要的偏移方向相反
        sourceXOffset = -positionOffset.x * scaleX
        sourceYOffset = -positionOffset.y * scaleY
      }

      // Draw the specific portion of the source image with position offset
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      ctx.drawImage(
        img,
        c * sliceWidth + sourceXOffset, // Source X with offset
        r * sliceHeight + sourceYOffset, // Source Y with offset
        sliceWidth, // Source Width
        sliceHeight, // Source Height
        0, // Dest X
        0, // Dest Y
        sliceWidth, // Dest Width
        sliceHeight // Dest Height
      )

      // Convert to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      )

      if (blob) {
        // Create filename: sticker_01.png, sticker_02.png...
        // Index is row-major (0, 1, 2...)
        const index = r * cols + c + 1
        const filename = `sticker_${index.toString().padStart(2, '0')}.png`
        folder.file(filename, blob)
      }

      processedCount++
      if (onProgress) {
        onProgress((processedCount / totalCount) * 50) // First 50% is slicing
      }
    }
  }

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      // Map 0-100 zip progress to 50-100 total progress
      onProgress(50 + metadata.percent / 2)
    }
  })

  // Save File
  const originalName = file.name.replace(/\.[^/.]+$/, '')
  saveAs(content, `${originalName}_sliced.zip`)

  // Cleanup
  URL.revokeObjectURL(img.src)
}
