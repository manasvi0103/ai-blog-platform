"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Target, Users, FileText, ArrowRight } from "lucide-react"
import type { Keyword } from "@/types/api"
import { StepperHeader } from "@/components/stepper-header"
import { api } from "@/lib/api"

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    loadKeywords()
  }, [])

  const loadKeywords = async () => {
    try {
      // Get the draft to find the company name
      const draft = await api.getDraft(draftId)
      const companyName = draft.blogId?.companyId?.name || 'Wattmonk'

      // Fetch real keywords from backend using API client
      const keywordsData = await api.getKeywords(companyName)
      setKeywords(keywordsData)

    } catch (error) {
      console.error('Error loading keywords:', error)

      // Fallback to solar industry keywords if API fails
      const fallbackKeywords = [
        {
          focusKeyword: "solar panel installation guide",
          articleFormat: "guide",
          wordCount: "1500-2000",
          targetAudience: "Homeowners",
          objective: "Lead generation",
          source: "fallback" as const,
        },
        {
          focusKeyword: "solar energy cost savings",
          articleFormat: "how-to",
          wordCount: "1200-1800",
          targetAudience: "Property owners",
          objective: "Education",
          source: "fallback" as const,
        },
        {
          focusKeyword: "commercial solar design",
          articleFormat: "guide",
          wordCount: "1800-2000",
          targetAudience: "Business owners",
          objective: "Lead generation",
          source: "fallback" as const,
        },
        {
          focusKeyword: "solar permit process",
          articleFormat: "how-to",
          wordCount: "1000-1500",
          targetAudience: "Solar installers",
          objective: "Education",
          source: "fallback" as const,
        },
      ]

      setKeywords(fallbackKeywords)

      toast({
        title: "Using fallback keywords",
        description: "Loaded solar industry keywords. Check backend connection for Google Sheets data.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedKeyword) {
      toast({
        title: "Please select a keyword",
        description: "You must select a focus keyword to continue.",
        variant: "destructive",
      })
      return
    }

    // Save selected keyword
    localStorage.setItem(`keyword_${draftId}`, selectedKeyword)

    toast({
      title: "Keyword selected",
      description: "Moving to SEO meta generation.",
    })
    router.push(`/blog/${draftId}/meta`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={2} draftId={draftId} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={2} draftId={draftId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Focus Keyword</h1>
            <p className="text-gray-600">Choose the primary keyword for your blog post</p>
          </div>

          <RadioGroup value={selectedKeyword} onValueChange={setSelectedKeyword}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="relative animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Label htmlFor={`keyword-${index}`} className="cursor-pointer">
                    <Card
                      className={`enhanced-card transition-all duration-300 ${
                        selectedKeyword === keyword.focusKeyword
                          ? "ring-2 ring-blue-500 border-blue-300 shadow-lg shadow-blue-500/25"
                          : "hover:border-gray-300"
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                              {keyword.focusKeyword}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {keyword.articleFormat}
                              </Badge>
                              <Badge
                                variant={keyword.source === "ai" ? "default" : "secondary"}
                                className={keyword.source === "ai" ? "badge-ai" : "badge-manual"}
                              >
                                {keyword.source === "ai" ? "AI Generated" : "Manual"}
                              </Badge>
                            </div>
                          </div>
                          <RadioGroupItem
                            value={keyword.focusKeyword}
                            id={`keyword-${index}`}
                            className="mt-1 w-5 h-5"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Word Count</p>
                              <p className="text-sm font-semibold">{keyword.wordCount}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Users className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Audience</p>
                              <p className="text-sm font-semibold">{keyword.targetAudience}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium mb-1">Objective</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{keyword.objective}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Company
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!selectedKeyword}
              className="bg-[#0066cc] hover:bg-blue-700 px-8"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue to Meta Generation
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
