'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { Sun, Moon, Plus } from "lucide-react"
import { useTheme } from 'next-themes'
import { useToast } from "@/components/ui/use-toast"
import { AuthButtons } from "@/components/AuthButtons"
import { Icons } from "@/components/icons"
import { useImageManager } from "@/lib/useImageManager"
import { ImageUpload } from "@/components/ImageUpload"
import { ImageGrid } from "@/components/ImageGrid"
import { ImageToolbar } from "@/components/ImageToolbar"
import { useQuery } from '@tanstack/react-query'

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-6">Welcome to bg-remover</h1>
      <p className="text-xl mb-8">Remove backgrounds from your images with ease.</p>
      <AuthButtons />
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Use our custom image manager hook
  const imageManager = useImageManager()

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error('Health check failed')
      }
      return response.json()
    },
    refetchInterval: imageManager.isProcessing ? 5000 : false,
    refetchIntervalInBackground: false,
  })

  // Handle image processing with toast notifications
  const handleProcessImages = async (imageIds?: string[]) => {
    try {
      await imageManager.processImages(imageIds)
      
      // Show success message only if no errors occurred
      if (imageManager.errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully processed ${imageManager.completedCount} image(s)`,
        })
      } else if (imageManager.completedCount > 0) {
        toast({
          title: "Partial Success",
          description: `Processed ${imageManager.completedCount} image(s), ${imageManager.errorCount} failed`,
          variant: "default"
        })
      }
    } catch (error) {
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process images",
        variant: "destructive"
      })
    }
  }

  const handleProcessAll = () => handleProcessImages()
  const handleProcessSelected = () => handleProcessImages(imageManager.selectedImages)

  const handleProcessImage = (id: string) => handleProcessImages([id])

  // Calculate counts for toolbar
  const selectedCount = imageManager.selectedImages.length
  const processedCount = imageManager.images.filter(img => img.processed).length
  const unprocessedCount = imageManager.images.length - processedCount

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">
      <Icons.spinner className="mr-2 my-auto h-24 w-24 animate-spin" />
    </div>
  }

  if (!session) {
    return <LandingPage />
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-background shadow-md">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">rm-bg</h1>
          <div className="flex items-center space-x-4">
            {/* Health Status */}
            {healthData && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${healthData.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>
                  {healthData.currently_processing ? 'Processing...' : 'Ready'}
                </span>
              </div>
            )}
            
            <AuthButtons />
            
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {imageManager.images.length === 0 ? (
          <ImageUpload 
            onImagesSelected={imageManager.addImages}
            disabled={imageManager.isProcessing}
          />
        ) : (
          <>
            <ImageToolbar
              images={imageManager.images}
              selectedCount={selectedCount}
              processedCount={processedCount}
              unprocessedCount={unprocessedCount}
              isProcessing={imageManager.isProcessing}
              onProcessAll={handleProcessAll}
              onProcessSelected={handleProcessSelected}
              onDownloadAll={imageManager.downloadAll}
              onDownloadSelected={imageManager.downloadSelected}
              onDeleteAll={imageManager.removeAll}
              onDeleteSelected={imageManager.removeSelected}
              onSelectAll={imageManager.selectAll}
              onDeselectAll={imageManager.deselectAll}
              onClearErrors={imageManager.clearErrors}
            />

            <ImageGrid
              images={imageManager.images}
              onToggleSelection={imageManager.toggleSelection}
              onRemoveImage={imageManager.removeImage}
              onProcessImage={handleProcessImage}
              onDownloadImage={imageManager.downloadImage}
              isProcessing={imageManager.isProcessing}
            />

            {/* Floating Add Button */}
            <button
              className="fixed bottom-6 right-6 rounded-full p-3 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Plus className="h-6 w-6" />
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    imageManager.addImages(files);
                  }
                }}
                className="hidden"
              />
            </button>
          </>
        )}
      </main>
    </>
  )
}