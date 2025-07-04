import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ImageFile } from '@/lib/useImageManager';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  disabled?: boolean;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function ImageUpload({ onImagesSelected, disabled = false }: ImageUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    // Handle rejected files with detailed error messages
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => ({
        file,
        errors: errors.map((e: any) => {
          // Provide user-friendly error messages
          switch (e.code) {
            case 'file-too-large':
              return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 50MB.`;
            case 'file-invalid-type':
              return `Invalid file type: ${file.type}. Please upload an image file.`;
            case 'too-many-files':
              return 'Too many files selected. Please select fewer files.';
            default:
              return e.message;
          }
        }).join(', ')
      }));
      
      console.error('Rejected files:', errors);
      
      // Show error messages to user via toast
      errors.forEach(({ file, errors }) => {
        toast({
          title: `File rejected: ${file.name}`,
          description: errors,
          variant: "destructive",
        });
      });
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      const newUploadFiles: UploadFile[] = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'uploading',
        progress: 0,
      }));

      setUploadFiles(prev => [...prev, ...newUploadFiles]);

      // Simulate upload progress for better UX
      newUploadFiles.forEach((uploadFile, index) => {
        const interval = setInterval(() => {
          setUploadFiles(prev => 
            prev.map(uf => 
              uf.id === uploadFile.id 
                ? { ...uf, progress: Math.min(uf.progress + 10, 90) }
                : uf
            )
          );
        }, 100);

        // Complete upload after a short delay
        setTimeout(() => {
          clearInterval(interval);
          setUploadFiles(prev => 
            prev.map(uf => 
              uf.id === uploadFile.id 
                ? { ...uf, status: 'success', progress: 100 }
                : uf
            )
          );

          // Remove from upload list after showing success
          setTimeout(() => {
            setUploadFiles(prev => prev.filter(uf => uf.id !== uploadFile.id));
          }, 1000);
        }, 1000 + index * 200);
      });

      // Pass files to parent component
      onImagesSelected(acceptedFiles);
    }
  }, [onImagesSelected, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.tif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    disabled,
  });

  const removeUploadFile = (id: string) => {
    setUploadFiles(prev => prev.filter(uf => uf.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Drag & drop images here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, TIFF (Max 50MB)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadFiles.map((uploadFile) => (
          <motion.div
            key={uploadFile.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-muted/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {uploadFile.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                )}
                {uploadFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {uploadFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium truncate">
                  {uploadFile.file.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadFile(uploadFile.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <Progress value={uploadFile.progress} className="h-2" />
            
            {uploadFile.error && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadFile.error}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 