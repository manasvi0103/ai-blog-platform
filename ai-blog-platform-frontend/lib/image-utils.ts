/**
 * Utility functions for handling image URLs and paths
 */

/**
 * Get the backend base URL from environment configuration
 */
export function getBackendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
}

/**
 * Convert a relative image path to an absolute URL
 * @param imagePath - The image path from the backend (e.g., "/uploads/filename.jpg" or "filename.jpg")
 * @returns Absolute URL for the image
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) {
    return ''
  }

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  const backendBaseUrl = getBackendBaseUrl()

  // If it starts with /uploads/, prepend the backend base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${backendBaseUrl}${imagePath}`
  }

  // If it's just a filename, assume it's in the uploads directory
  if (!imagePath.startsWith('/')) {
    return `${backendBaseUrl}/uploads/${imagePath}`
  }

  // For any other relative path, prepend the backend base URL
  return `${backendBaseUrl}${imagePath}`
}

/**
 * Check if an image URL is valid and accessible
 * @param imageUrl - The image URL to check
 * @returns Promise that resolves to true if image is accessible
 */
export async function isImageAccessible(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Image accessibility check failed:', error)
    return false
  }
}

/**
 * Get a fallback image URL for when the primary image fails to load
 * @param type - The type of image (feature, in-blog, etc.)
 * @returns Fallback image URL
 */
export function getFallbackImageUrl(type: 'feature' | 'in-blog' | 'general' = 'general'): string {
  const width = type === 'feature' ? 800 : 400
  const height = type === 'feature' ? 400 : 300
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/666666?text=Image+Not+Found`
}
