import { supabase } from './supabase'
import { compressImage } from '@/utils/compressImage'

export async function uploadRestaurantLogo(
  file: File,
  restaurantId: string
): Promise<string | null> {
  const ext = 'webp'
  const fileName = `logo-${restaurantId}.${ext}`

  const compressedBlob = await compressImage(file, { maxWidth: 400, maxHeight: 400, maxSizeKB: 100 })
  const uploadedFile = new File([compressedBlob], fileName, { type: 'image/webp' })

  const { error: uploadError } = await supabase.storage
    .from('restaurantes')
    .upload(fileName, uploadedFile, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error al subir logo:', uploadError)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('restaurantes')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function deleteRestaurantLogo(restaurantId: string): Promise<boolean> {
  const fileName = `logo-${restaurantId}.webp`

  const { error } = await supabase.storage
    .from('restaurantes')
    .remove([fileName])

  if (error) {
    console.error('Error al eliminar logo:', error)
    return false
  }

  return true
}
