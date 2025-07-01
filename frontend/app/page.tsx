'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, X, Trash2, Sun, Moon, Download } from "lucide-react"
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { AuthButtons } from "@/components/AuthButtons"
import { Icons } from "@/components/icons"
import { getApiUrl } from "@/lib/config"

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  isSelected?: boolean;
  filename: string;
  uploadTime: number;
}

interface QueueStatus {
  queue_size: number;
  currently_processing: boolean;
}

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
  const [images, setImages] = useState<ImageFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([])
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ queue_size: 0, currently_processing: false })

  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Load images from localStorage on mount
  useEffect(() => {
    const storedImages = localStorage.getItem('backgroundRemovalImages')
    if (storedImages) {
      try {
        const parsed = JSON.parse(storedImages)
        // Filter out any invalid entries and add missing properties
        const validImages = parsed.filter((img: any) => img && img.id && img.preview).map((img: any) => ({
          ...img,
          filename: img.filename || `image_${img.id}`,
          uploadTime: img.uploadTime || Date.now(),
          isSelected: false
        }))
        setImages(validImages)
      } catch (error) {
        console.error('Error loading images from localStorage:', error)
        localStorage.removeItem('backgroundRemovalImages')
      }
    }
  }, [])

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem('backgroundRemovalImages', JSON.stringify(images))
    } else {
      localStorage.removeItem('backgroundRemovalImages')
    }
  }, [images])

  // Poll queue status
  useEffect(() => {
    const pollQueueStatus = async () => {
      try {
        const response = await fetch(getApiUrl('/health'))
        if (response.ok) {
          const data = await response.json()
          setQueueStatus({
            queue_size: data.queue_size || 0,
            currently_processing: data.currently_processing || false
          })
        }
      } catch (error) {
        console.error('Error polling queue status:', error)
      }
    }

    // Poll every 2 seconds
    const interval = setInterval(pollQueueStatus, 2000)
    pollQueueStatus() // Initial poll

    return () => clearInterval(interval)
  }, [])

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      filename: file.name,
      uploadTime: Date.now(),
      isSelected: false
    }))
    setSelectedImages(newImages)
    setShowModal(true)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} })

  const processImages = async (imagesToProcess: ImageFile[]) => {
    setIsLoading(true)
    toast({
      title: "Processing images...",
      description: `Please wait while we remove the background from ${imagesToProcess.length} image(s).`,
    })

    for (const image of imagesToProcess) {
      const formData = new FormData()
      formData.append('image', image.file)

      try {
        const response = await fetch(getApiUrl('/remove-background'), {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob()
          const processedUrl = URL.createObjectURL(blob)
          setImages(prev => prev.map(img => 
            img.id === image.id ? { ...img, processed: processedUrl } : img
          ))
        } else {
          const errorText = await response.text()
          console.error('Error processing image:', response.status, errorText)
          toast({
            title: "Error",
            description: `Failed to remove background for ${image.filename}`,
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Network error:', error)
        toast({
          title: "Error",
          description: `Network error for ${image.filename}`,
          variant: "destructive"
        })
      }
    }

    setIsLoading(false)
    toast({
      title: "Success",
      description: `Processed ${imagesToProcess.length} image(s) successfully`,
    })
  }

  const handleUpload = () => {
    setImages(prev => [...prev, ...selectedImages])
    setShowModal(false)
    setSelectedImages([])
  }

  const toggleImageSelection = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isSelected: !img.isSelected } : img
    ))
  }

  const deleteImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        // Clean up object URLs
        URL.revokeObjectURL(image.preview)
        if (image.processed) {
          URL.revokeObjectURL(image.processed)
        }
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const deleteSelectedImages = () => {
    const selectedImages = images.filter(img => img.isSelected)
    selectedImages.forEach(image => {
      URL.revokeObjectURL(image.preview)
      if (image.processed) {
        URL.revokeObjectURL(image.processed)
      }
    })
    setImages(prev => prev.filter(img => !img.isSelected))
    toast({
      title: "Deleted",
      description: `Removed ${selectedImages.length} image(s)`,
    })
  }

  const deleteAllImages = () => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview)
      if (image.processed) {
        URL.revokeObjectURL(image.processed)
      }
    })
    setImages([])
    toast({
      title: "Deleted",
      description: "Removed all images",
    })
  }

  const downloadSelectedImages = () => {
    const selectedProcessed = images.filter(img => img.isSelected && img.processed)
    selectedProcessed.forEach(image => {
      const link = document.createElement('a')
      link.href = image.processed!
      link.download = `processed_${image.filename}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  const processAllImages = () => {
    const unprocessedImages = images.filter(img => !img.processed)
    processImages(unprocessedImages)
  }

  const downloadAllProcessedImages = () => {
    const processedImages = images.filter(img => img.processed)
    processedImages.forEach(image => {
      const link = document.createElement('a')
      link.href = image.processed!
      link.download = `processed_${image.filename}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">
      <Icons.spinner className="mr-2 my-auto h-24 w-24 animate-spin" />
    </div>
  }

  if (!session) {
    return <LandingPage />
  }

  const selectedCount = images.filter(img => img.isSelected).length
  const processedCount = images.filter(img => img.processed).length
  const unprocessedCount = images.length - processedCount

  return (
    <>
      <header className="sticky top-0 z-10 bg-background shadow-md">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">rm-bg</h1>
          <div className="flex items-center space-x-4">
            {/* Queue Status */}
            {(queueStatus.queue_size > 0 || queueStatus.currently_processing) && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {queueStatus.currently_processing ? 'Processing...' : `Queue: ${queueStatus.queue_size}`}
                </span>
              </div>
            )}
            
            <AuthButtons />
            
            {/* Theme Toggle Icon Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {images.length === 0 && (
          <Card {...getRootProps()} className="mb-6 h-64 flex items-center justify-center hover:border-primary transition-colors">
            <CardContent className="p-6 text-center">
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-xl">Drop the files here ...</p>
              ) : (
                <p className="text-xl">Drag &apos;n&apos; drop some files here, or click to select files</p>
              )}
            </CardContent>
          </Card>
        )}

        {images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 bg-gray-100/10 p-4 rounded-lg min-h-20 items-center justify-start">
            {selectedCount === 0 ? (
              <>
                <Button 
                  onClick={processAllImages}
                  disabled={isLoading || processedCount === images.length}
                >
                  {isLoading ? 'Processing...' : `Process All (${images.length - processedCount})`}
                </Button>
                {processedCount > 0 && (
                  <Button onClick={downloadAllProcessedImages} variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download All ({processedCount})
                  </Button>
                )}
                <Button onClick={deleteAllImages} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => processImages(images.filter(img => img.isSelected && !img.processed))}
                  disabled={isLoading || images.every(img => img.processed)}
                >
                  {isLoading ? 'Processing...' : `Process Selected (${selectedCount})`}
                </Button>
                {images.filter(img => img.isSelected && img.processed).length > 0 && (
                  <Button onClick={downloadSelectedImages} variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download Selected ({images.filter(img => img.isSelected && img.processed).length})
                  </Button>
                )}
                <Button onClick={deleteSelectedImages} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedCount})
                </Button>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg truncate">{image.filename}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={image.isSelected}
                        onCheckedChange={() => toggleImageSelection(image.id)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteImage(image.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="relative aspect-square">
                      <Image 
                        src={image.processed || image.preview} 
                        alt={image.filename} 
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    {!image.processed && (
                      <Button 
                        onClick={() => processImages([image])} 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Remove Background'}
                      </Button>
                    )}
                    {image.processed && (
                      <Button asChild variant="secondary">
                        <a href={image.processed} download={`processed_${image.filename}`}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length > 0 && (
          <Button
            className="fixed bottom-6 right-6 rounded-full p-3"
            size="icon"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <Plus className="h-6 w-6" />
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onDrop(Array.from(e.target.files || []))}
              className="hidden"
            />
          </Button>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Upload</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4">
              {selectedImages.map((image) => (
                <div key={image.id} className="relative">
                  <Image src={image.preview} alt={image.filename} width={100} height={100} objectFit="cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-0 right-0"
                    onClick={() => setSelectedImages(prev => prev.filter(img => img.id !== image.id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}