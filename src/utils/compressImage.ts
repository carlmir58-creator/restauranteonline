export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7,
  maxSizeKB: 150,
}

export function compressImage(file: File, options?: CompressOptions): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > height && width > opts.maxWidth) {
        height = Math.round(height * (opts.maxWidth / width))
        width = opts.maxWidth
      } else if (height > opts.maxHeight) {
        width = Math.round(width * (opts.maxHeight / height))
        height = opts.maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'))
              return
            }
            if (blob.size > opts.maxSizeKB * 1024 && quality > 0.1) {
              tryCompress(quality - 0.1)
            } else {
              resolve(blob)
            }
          },
          'image/webp',
          quality
        )
      }

      tryCompress(opts.quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = url
  })
}
