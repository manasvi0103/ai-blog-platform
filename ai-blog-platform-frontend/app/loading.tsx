export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center space-y-6">
        {/* Main loading animation */}
        <div className="relative">
          {/* Outer ring */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
          {/* Inner spinning ring */}
          <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-blue-600"></div>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        </div>

        {/* Loading text with animation */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-600 font-medium">Loading</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Subtle progress indicator */}
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
        </div>

        {/* Optional loading message */}
        <p className="text-sm text-slate-500 text-center max-w-xs">
          Please wait while we prepare your content...
        </p>
      </div>
    </div>
  )
}
