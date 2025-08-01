"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sparkles, Check } from "lucide-react"
import { StepperHeader } from "@/components/stepper-header"

export default function GeneratingContentPage() {
  const [currentTask, setCurrentTask] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const router = useRouter()
  const params = useParams()
  const draftId = params.draftId as string

  const tasks = [
    "Analyzing selected keyword and meta data",
    "Generating 9 content blocks with keyword focus",
    "Creating image prompts and citations",
    "Preparing content for editing"
  ]

  useEffect(() => {
    // Skip the slow animation and redirect immediately
    const timer = setTimeout(() => {
      router.push(`/blog/${draftId}/editor`)
    }, 500) // Just 0.5 seconds instead of 8+ seconds

    return () => clearTimeout(timer)
  }, [draftId, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={3} draftId={draftId} />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
              <h1 className="text-2xl font-bold text-gray-900">Generating Your Content</h1>
              <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-gray-600">AI is creating keyword-focused content blocks, images, and citations...</p>
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
