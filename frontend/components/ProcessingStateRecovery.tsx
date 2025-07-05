import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessingImage {
  id: string;
  title: string;
  status: string;
}

export function ProcessingStateRecovery() {
  const [recoveredImages, setRecoveredImages] = useState<ProcessingImage[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const { data: session } = useSession();

  // Check for processing images on mount
  const { data: images } = useQuery({
    queryKey: ['processing-recovery'],
    queryFn: async () => {
      if (!session?.user?.email) return [];
      
      const response = await fetch('/api/images');
      if (!response.ok) return [];
      
      const allImages = await response.json();
      return allImages.filter((img: any) => img.status === 'processing');
    },
    enabled: !!session?.user?.email,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (images && images.length > 0) {
      setRecoveredImages(images);
      setShowNotification(true);
      
      // Show toast notification
      toast.warning(
        `Found ${images.length} image${images.length > 1 ? 's' : ''} that ${images.length > 1 ? 'were' : 'was'} being processed`, 
        {
          description: "Processing may have been interrupted. You can restart processing for these images.",
          duration: 10000,
          action: {
            label: "View",
            onClick: () => {
              setShowNotification(true);
            },
          },
        }
      );
    }
  }, [images]);

  if (!showNotification || recoveredImages.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-card border border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">
            Processing Interrupted
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {recoveredImages.length} image{recoveredImages.length > 1 ? 's were' : ' was'} being processed when the session was interrupted.
          </p>
          
          <div className="mt-3 space-y-2">
            {recoveredImages.slice(0, 3).map((image) => (
              <div key={image.id} className="flex items-center space-x-2 text-xs">
                <Loader2 className="h-3 w-3 text-orange-500" />
                <span className="truncate text-muted-foreground">
                  {image.title}
                </span>
              </div>
            ))}
            
            {recoveredImages.length > 3 && (
              <p className="text-xs text-muted-foreground">
                ...and {recoveredImages.length - 3} more
              </p>
            )}
          </div>
          
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                // Refresh the page to get latest states
                window.location.reload();
              }}
              className="text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded transition-colors"
            >
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Refresh
            </button>
            <button
              onClick={() => setShowNotification(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 