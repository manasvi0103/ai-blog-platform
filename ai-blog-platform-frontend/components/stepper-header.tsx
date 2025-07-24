"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface StepperHeaderProps {
  currentStep: number
  draftId: string
  companyName?: string
}

const steps = [
  { id: 1, name: "Company", path: "/" },
  { id: 2, name: "Keywords", path: "/keywords" },
  { id: 3, name: "Content", path: "/editor" },
]

export function StepperHeader({ currentStep, draftId, companyName }: StepperHeaderProps) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSaveExit = async () => {
    setSaving(true)
    try {
      // Save current progress
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Progress saved",
        description: "Your work has been saved successfully.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0066cc]">ArticleScribe</h1>
            {companyName && <p className="text-sm text-gray-600">{companyName}</p>}
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Step {currentStep} of {steps.length}
            </Badge>

            <Button onClick={handleSaveExit} disabled={saving} variant="outline" size="sm">
              {saving ? (
                <>
                  <Save className="h-4 w-4 mr-1 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save & Exit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${
                    step.id < currentStep
                      ? "bg-[#00aa66] text-white"
                      : step.id === currentStep
                        ? "bg-[#0066cc] text-white"
                        : "bg-gray-200 text-gray-500"
                  }
                `}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={`
                  ml-2 text-sm font-medium
                  ${step.id <= currentStep ? "text-gray-900" : "text-gray-500"}
                `}
                >
                  {step.name}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                  w-12 h-0.5 mx-4
                  ${step.id < currentStep ? "bg-[#00aa66]" : "bg-gray-200"}
                `}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
