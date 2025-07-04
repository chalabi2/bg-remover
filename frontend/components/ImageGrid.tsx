import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Download, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ImageFile } from '@/lib/useImageManager';

interface ImageGridProps {
  images: ImageFile[];
  onToggleSelection: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onProcessImage: (id: string) => void;
  onDownloadImage: (image: ImageFile) => void;
  isProcessing: boolean;
}

export function ImageGrid({ 
  images, 
  onToggleSelection, 
  onRemoveImage, 
  onProcessImage, 
  onDownloadImage,
  isProcessing 
}: ImageGridProps) {
  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ImageFile['status']) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  return (
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm truncate flex-1 mr-2">
                  {image.filename}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={image.isSelected}
                    onCheckedChange={() => onToggleSelection(image.id)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveImage(image.id)}
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
                    fill
                    className="rounded-md object-cover"
                  />
                  
                  {/* Status overlay */}
                  {image.status !== 'pending' && (
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                      {getStatusIcon(image.status)}
                      <span>{getStatusText(image.status)}</span>
                    </div>
                  )}
                  
                  {/* Progress overlay */}
                  {image.status === 'processing' && image.progress !== undefined && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <Progress value={image.progress} className="h-2" />
                    </div>
                  )}
                </div>
                
                {/* Error message */}
                {image.status === 'error' && image.error && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {image.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-end pt-2">
                {image.status === 'error' && (
                  <Button 
                    onClick={() => onProcessImage(image.id)}
                    disabled={isProcessing}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                
                {!image.processed && image.status !== 'processing' && (
                  <Button 
                    onClick={() => onProcessImage(image.id)} 
                    disabled={isProcessing}
                    size="sm"
                  >
                    {isProcessing ? 'Processing...' : 'Remove Background'}
                  </Button>
                )}
                
                {image.processed && (
                  <Button 
                    onClick={() => onDownloadImage(image)}
                    variant="secondary"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 