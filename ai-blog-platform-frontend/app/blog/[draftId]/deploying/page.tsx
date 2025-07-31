"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sparkles, Check, ExternalLink } from "lucide-react"
import { StepperHeader } from "@/components/stepper-header"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function DeployingPage() {
  const [currentTask, setCurrentTask] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [deploymentComplete, setDeploymentComplete] = useState(false)
  const [wordpressUrl, setWordpressUrl] = useState<string | null>(null)
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const draftId = params.draftId as string

  const tasks = [
    "Processing content and uploading images",
    "Generating internal and external links",
    "Creating WordPress draft post",
    "Finalizing SEO optimization"
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout

    const performDeployment = async () => {
      try {
        // Start the visual progress
        interval = setInterval(() => {
          setCurrentTask((prev) => {
            const next = prev + 1
            if (next < tasks.length) {
              setCompletedTasks((completed) => [...completed, prev])
              return next
            } else {
              // Mark last task as completed
              setCompletedTasks((completed) => [...completed, prev])
              clearInterval(interval)
              return prev
            }
          })
        }, 2000) // Each task takes 2 seconds

        // Perform actual deployment
        console.log('🚀 Starting WordPress deployment...')
        const result = await api.deployWordPress(draftId) as any
        console.log('✅ WordPress deployment result:', result)

        // Clear interval and show result
        clearInterval(interval)
        setCompletedTasks([0, 1, 2, 3]) // Mark all tasks complete

        if (result?.success) {
          setDeploymentComplete(true)
          setWordpressUrl(result.editUrl)
          toast({
            title: "Deployment successful!",
            description: "Your blog post has been deployed to WordPress.",
          })
        } else {
          throw new Error(result?.message || result?.error || 'Deployment failed')
        }
      } catch (error: any) {
        console.error('❌ WordPress deployment failed:', error)
        clearInterval(interval)
        setDeploymentError(error.message || 'Deployment failed')
        toast({
          title: "Deployment failed",
          description: error.message || "Failed to deploy to WordPress. Please try again.",
          variant: "destructive",
        })
      }
    }

    performDeployment()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [draftId, toast])

  const handleViewInWordPress = () => {
    if (wordpressUrl) {
      window.open(wordpressUrl, '_blank')
    }
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleRetryDeployment = () => {
    // Reset state and retry
    setCurrentTask(0)
    setCompletedTasks([])
    setDeploymentComplete(false)
    setDeploymentError(null)
    setWordpressUrl(null)
    // The useEffect will trigger again
    window.location.reload()
  }

  if (deploymentError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={4} draftId={draftId} />

        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Error Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Deployment Failed</h1>
              <p className="text-gray-600">{deploymentError}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleRetryDeployment}
                className="bg-[#0066cc] hover:bg-blue-700"
              >
                Retry Deployment
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (deploymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={4} draftId={draftId} />
        
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Success Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Deployment Successful!</h1>
              <p className="text-gray-600">Your blog post has been successfully deployed to WordPress as a draft.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleViewInWordPress}
                className="bg-[#0066cc] hover:bg-blue-700"
                disabled={!wordpressUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in WordPress
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={4} draftId={draftId} />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
              <h1 className="text-2xl font-bold text-gray-900">Deploying to WordPress</h1>
              <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-gray-600">AI is deploying your blog post to WordPress...</p>
          </div>

          {/* Progress Tasks */}
          <div className="max-w-2xl mx-auto space-y-4">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-500 ${
                  completedTasks.includes(index)
                    ? "bg-green-50 border-green-200"
                    : currentTask === index
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex-shrink-0">
                  {completedTasks.includes(index) ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : currentTask === index ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    completedTasks.includes(index)
                      ? "text-green-700"
                      : currentTask === index
                      ? "text-blue-700"
                      : "text-gray-500"
                  }`}
                >
                  {task}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((completedTasks.length + (currentTask < tasks.length ? 1 : 0)) / tasks.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {completedTasks.length + (currentTask < tasks.length ? 1 : 0)} of {tasks.length} tasks completed
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
