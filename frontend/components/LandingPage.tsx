import { AuthButtons } from "./AuthButtons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield, Upload, Loader2, Play } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState, useCallback } from "react"

// Processing animation states
type ProcessingState = 'original' | 'processing' | 'processed'

function ProcessingShowcase() {
  const [state, setState] = useState<ProcessingState>('original')
  const [isAnimating, setIsAnimating] = useState(false)
  
  const startProcessing = useCallback(async () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setState('processing')
    
    // Simulate processing time
    setTimeout(() => {
      setState('processed')
      setIsAnimating(false)
    }, 2500)
  }, [isAnimating])
  
  const reset = useCallback(() => {
    if (isAnimating) return
    setState('original')
  }, [isAnimating])
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Demo</h3>
        <p className="text-muted-foreground">Click the button to see AI background removal in action</p>
      </div>
      
      {/* Fixed height grid to prevent layout shifts */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Before/Original Image - ALWAYS VISIBLE */}
        <div className="space-y-2 flex-shrink-0 min-w-0">
          <div className="text-sm font-medium text-muted-foreground text-center h-5 flex items-center justify-center">Before</div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative w-full">
            {/* Original image - PERMANENTLY VISIBLE - Never changes or disappears */}
            <Image
              src="/supra.jpg"
              alt="Original car image with background"
              fill
              className="object-cover"
              priority={true}
            />
            {/* Permanent status overlay - always shows "Original" */}
            <div className="absolute inset-0 bg-black/20 flex items-end pointer-events-none">
              <div className="p-3 text-white">
                <p className="text-xs font-medium">Original</p>
                <p className="text-xs opacity-90">With background</p>
              </div>
            </div>
            {/* Processing overlay - only appears during processing, doesn't hide original */}
            {state === 'processing' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-500">
                <div className="text-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-medium">Analyzing...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* After/Processed Image - FIXED SIZE */}
        <div className="space-y-2 flex-shrink-0 min-w-0">
          <div className="text-sm font-medium text-muted-foreground text-center h-5 flex items-center justify-center">After</div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative w-full border-2 border-dashed border-primary/30">
            {/* Base layer to maintain container size - always present */}
            <div className="absolute inset-0 w-full h-full" />
            
            {/* Default State - Ready to process */}
            {state === 'original' && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <div className="text-center p-4">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-primary opacity-75">Click to remove background</p>
                </div>
              </div>
            )}
            
            {/* Processing State */}
            {state === 'processing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 transition-all duration-500">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-primary font-medium">Processing with AI...</p>
                  <p className="text-xs text-primary/70 mt-1">Removing background...</p>
                </div>
              </div>
            )}
            
            {/* Processed State - Show the actual result */}
            {state === 'processed' && (
              <div className="absolute inset-0 transition-all duration-500">
                <Image
                  src="/supra-trans.png"
                  alt="Car with background removed"
                  fill
                  className="object-contain p-3"
                  priority={true}
                />
                <div className="absolute inset-0 pointer-events-none">
                  {/* Success indicator */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center space-x-1 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-700">
                      <Sparkles className="w-3 h-3" />
                      <span>Done!</span>
                    </div>
                  </div>
                  {/* Bottom overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-3">
                    <div className="text-white text-center">
                      <p className="text-xs font-medium">Background Removed</p>
                      <p className="text-xs opacity-90">Ready for download</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

     

      {/* Status indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs sm:text-sm transition-all duration-300 ${
          state === 'processing' 
            ? 'bg-primary/20 text-primary' 
            : state === 'processed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {state === 'original' && (
            <>
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span>Ready to process</span>
            </>
          )}
          {state === 'processing' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Processing with RMBG-2.0...</span>
              <span className="sm:hidden">Processing...</span>
            </>
          )}
          {state === 'processed' && (
            <>
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Complete! Background removed</span>
              <span className="sm:hidden">Complete!</span>
            </>
          )}
        </div>
      </div>
       {/* Interactive Controls */}
       <div className="flex justify-center space-x-3">
        {state === 'original' && (
          <Button
            onClick={startProcessing}
            disabled={isAnimating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
          >
            <Play className="w-4 h-4 mr-2" />
            Remove Background
          </Button>
        )}
        
        {state === 'processed' && (
          <Button
            onClick={reset}
            variant="outline"
            className="px-6 py-2"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                {/* Logo and Title inline - Fixed alignment */}
                <div className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6 flex-wrap gap-3 sm:gap-4">
                  <Image 
                    src="/rmbg.svg" 
                    alt="BG-Remover Logo" 
                    width={48} 
                    height={48} 
                    className="drop-shadow-lg flex-shrink-0 sm:w-[60px] sm:h-[60px]"
                  />
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-center lg:text-left">
                    Remove Backgrounds
                  </h1>
                </div>
                
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed text-center lg:text-left">
                  Transform your images with AI-powered background removal. 
                  Upload any photo and get professional results in seconds - 
                  perfect for product photography, portraits, and creative projects.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground font-medium">Easy Upload</span>
                </div>
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground font-medium">AI Powered</span>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4 text-center lg:text-left">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg"
                  onClick={() => signIn('google')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No credit card required • Process unlimited images
                </p>
              </div>
            </div>

            {/* Right Side - Interactive Processing Demo */}
            <div className="relative order-first lg:order-last">
              <div className="bg-card rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-border">
                <ProcessingShowcase />
              </div>

              {/* Floating elements for visual appeal */}
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-16 sm:h-16 bg-purple-400/10 dark:bg-purple-600/20 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-border">
        <div className="text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p>Powered by RMBG-2.0 AI model from BRIA AI</p>
          <p className="hidden sm:block">This is a free, open-source tool for educational and personal use only.</p>
          <p className="sm:hidden">Free tool for educational and personal use only.</p>
          <p className="text-xs">Not licensed for commercial use. Please respect the model&apos;s terms of service.</p>
        </div>
      </footer>
    </div>
  )
}