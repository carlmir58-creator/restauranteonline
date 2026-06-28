import { supabase } from './supabase'
import { compressImage } from '@/utils/compressImage'

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string | null> {
  const ext = 'webp'
  const fileName = `prod-${productId}.${ext}`
  const filePath = `${fileName}`

  const compressedBlob = await compressImage(file)
  const uploadedFile = new File([compressedBlob], fileName, { type: 'image/webp' })

  const { error: uploadError } = await supabase.storage
    .from('productos')
    .upload(filePath, uploadedFile, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error al subir imagen:', uploadError)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('productos')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function deleteProductImage(productId: string): Promise<boolean> {
  const fileName = `prod-${productId}.webp`

  const { error } = await supabase.storage
    .from('productos')
    .remove([fileName])

  if (error) {
    console.error('Error al eliminar imagen:', error)
    return false
  }

  return true
}
