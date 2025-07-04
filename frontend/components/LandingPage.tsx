import { AuthButtons } from "./AuthButtons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield, Upload } from "lucide-react"
import { signIn } from "next-auth/react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                {/* Logo and Title inline */}
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <Image 
                    src="/rmbg.svg" 
                    alt="BG-Remover Logo" 
                    width={80} 
                    height={80} 
                    className="drop-shadow-lg mr-4"
                  />
                  <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                    Remove Backgrounds
                  </h1>
                </div>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Transform your images with AI-powered background removal. 
                  Upload any photo and get professional results in seconds - 
                  perfect for product photography, portraits, and creative projects.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-foreground font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Upload className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-foreground font-medium">Easy Upload</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-foreground font-medium">AI Powered</span>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
                  onClick={() => signIn('google')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  No credit card required • Process unlimited images
                </p>
              </div>
            </div>

            {/* Right Side - Visual Demo */}
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
                {/* Before/After Demo */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">See the Magic</h3>
                    <p className="text-muted-foreground">Upload your image and watch the background disappear</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before Image Placeholder */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground text-center">Before</div>
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center p-4">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Your Image</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* After Image Placeholder */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground text-center">After</div>
                      <div className="aspect-square bg-accent rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
                        <div className="text-center p-4">
                          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-sm text-primary">Background Removed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow indicating transformation */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>

              {/* Floating elements for visual appeal */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400/10 dark:bg-purple-600/20 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-border">
        <div className="text-center text-muted-foreground text-sm">
          <p>© 2024 BG-Remover. Professional background removal powered by AI.</p>
        </div>
      </footer>
    </div>
  )
}