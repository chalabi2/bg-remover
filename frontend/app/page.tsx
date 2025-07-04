'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useImageManager, ServerImage } from '@/lib/useImageManager'
import { ImageUpload } from '@/components/ImageUpload'
import { ImageGrid } from '@/components/ImageGrid'
import { ImageToolbar } from '@/components/ImageToolbar'
import { ImageViewer } from '@/components/ImageViewer'
import { AuthGuard } from '@/components/AuthGuard'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function BackgroundRemoverApp() {
  const [selectedImage, setSelectedImage] = useState<ServerImage | null>(null)
  
  const {
    images,
    isLoading,
    isUploading,
    isProcessing,
    selectedImages,
    error,
    uploadImage,
    processImage,
    processSelectedImages,
    updateImageTitle,
    selectImage,
    deselectImage,
    selectAllImages,
    deselectAllImages,
    downloadImage,
    downloadSelectedImages,
    refreshImages,
  } = useImageManager()

  const processedCount = images.filter(img => img.processed).length
  const selectedCount = selectedImages.size

  const handleViewImage = (image: ServerImage) => {
    setSelectedImage(image)
  }

  const handleCloseViewer = () => {
    setSelectedImage(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <ImageUpload
            onUpload={uploadImage}
            isUploading={isUploading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  Error
                </h3>
                <div className="mt-2 text-sm text-destructive">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {images.length > 0 && (
          <ImageToolbar
            totalImages={images.length}
            selectedCount={selectedCount}
            processedCount={processedCount}
            isProcessing={isProcessing}
            onSelectAll={selectAllImages}
            onDeselectAll={deselectAllImages}
            onProcessSelected={processSelectedImages}
            onDownloadSelected={downloadSelectedImages}
            onRefresh={refreshImages}
          />
        )}

        {/* Images Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading images...</p>
            </div>
          ) : (
            <ImageGrid
              images={images}
              selectedImages={selectedImages}
              onSelectImage={selectImage}
              onDeselectImage={deselectImage}
              onProcessImage={processImage}
              onDownloadImage={downloadImage}
              onUpdateTitle={updateImageTitle}
              onViewImage={handleViewImage}
            />
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={handleCloseViewer}
          onDownload={downloadImage}
          onUpdateTitle={updateImageTitle}
        />
      )}

      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* Footer with legal link */}
      <footer className="w-full border-t border-border bg-background py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <a href="/legal" className="underline hover:text-primary">Terms of Service & Privacy Policy</a>
        </div>
      </footer>
    </div>
  )
}

export default function Page() {
  return (
    <AuthGuard>
      <QueryClientProvider client={queryClient}>
        <BackgroundRemoverApp />
      </QueryClientProvider>
    </AuthGuard>
  )
}