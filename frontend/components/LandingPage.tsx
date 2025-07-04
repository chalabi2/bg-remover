import { AuthButtons } from "./AuthButtons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield, Upload } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">BG-Remover</span>
          </div>
          <AuthButtons />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Remove Backgrounds
                <span className="block text-blue-600">Instantly</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your images with AI-powered background removal. 
                Upload any photo and get professional results in seconds - 
                perfect for product photography, portraits, and creative projects.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-gray-700 font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Upload className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700 font-medium">Easy Upload</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700 font-medium">AI Powered</span>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-500">
                No credit card required • Process unlimited images
              </p>
            </div>
          </div>

          {/* Right Side - Visual Demo */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              {/* Before/After Demo */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">See the Magic</h3>
                  <p className="text-gray-600">Upload your image and watch the background disappear</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Before Image Placeholder */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 text-center">Before</div>
                    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center p-4">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Your Image</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* After Image Placeholder */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 text-center">After</div>
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
                      <div className="text-center p-4">
                        <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-600">Background Removed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow indicating transformation */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Floating elements for visual appeal */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-100 rounded-full opacity-50"></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 BG-Remover. Professional background removal powered by AI.</p>
        </div>
      </footer>
    </div>
  )
}