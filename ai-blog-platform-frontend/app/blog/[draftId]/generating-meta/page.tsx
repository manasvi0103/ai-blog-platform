"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { StepperHeader } from "@/components/stepper-header"

export default function GeneratingMetaPage() {
  const router = useRouter()
  const params = useParams()
  const draftId = params.draftId as string

  useEffect(() => {
    // Skip the slow animation and redirect immediately
    const timer = setTimeout(() => {
      router.push(`/blog/${draftId}/meta`)
    }, 500) // Just 0.5 seconds instead of 6+ seconds

    return () => clearTimeout(timer)
  }, [draftId, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={2} draftId={draftId} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900">Generating Meta Content...</h1>
            <p className="text-gray-600">Creating SEO-optimized titles and descriptions</p>
          </div>
        </div>
      </main>
    </div>
  )
}
