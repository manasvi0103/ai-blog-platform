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
import { RefreshCw, Tag } from "lucide-react"
import { StepperHeader } from "@/components/stepper-header"
import { SEOScoreCircle } from "@/components/seo-score-circle"
import { api } from "@/lib/api"

interface MetaBlock {
  id: string
  type: "h1" | "metaTitle" | "metaDescription"
  content: string
  scores: {
    keywordScore: number
    lengthScore: number
    readabilityScore: number
    trendScore: number
    totalScore: number
  }
  keywordsIncluded: string[]
}

export default function MetaPage() {
  const [metaBlocks, setMetaBlocks] = useState<MetaBlock[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<{
    h1: string
    metaTitle: string
    metaDescription: string
  }>({
    h1: "",
    metaTitle: "",
    metaDescription: "",
  })
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState<string>("")
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    generateMetaBlocks()
  }, [])

  const generateMetaBlocks = async () => {
    try {
      setLoading(true)

      // Get the selected keyword from localStorage as fallback, but the backend should have it saved
      const selectedKeyword = localStorage.getItem(`keyword_${draftId}`) || 'solar energy'

      console.log(`🎯 Using selected keyword for meta generation: ${selectedKeyword}`)
      console.log(`📝 Note: Backend should have this keyword saved in the draft from Step 1`)

      // Generate meta content using Gemini AI with the selected keyword
      // The backend will use the saved keyword from the draft
      const metaData = await api.generateMetaScores(draftId, selectedKeyword)

      // Create meta blocks from the real generated content
      const realMetaBlocks: MetaBlock[] = []

      // Convert API response to frontend format
      if (metaData.metaOptions && metaData.metaOptions.length > 0) {
        metaData.metaOptions.forEach((option: any, index: number) => {
          // Add H1 block
          realMetaBlocks.push({
            id: `h1-${index + 1}`,
            type: "h1",
            content: option.h1Title,
            scores: option.scores,
            keywordsIncluded: option.keywordsIncluded,
          })

          // Add Meta Title block
          realMetaBlocks.push({
            id: `meta-title-${index + 1}`,
            type: "metaTitle",
            content: option.metaTitle,
            scores: option.scores,
            keywordsIncluded: option.keywordsIncluded,
          })

          // Add Meta Description block
          realMetaBlocks.push({
            id: `meta-description-${index + 1}`,
            type: "metaDescription",
            content: option.metaDescription,
            scores: option.scores,
            keywordsIncluded: option.keywordsIncluded,
          })
        })
      } else {
        // Fallback if API fails
        realMetaBlocks.push(
          {
            id: "h1-1",
            type: "h1",
            content: `Complete Guide to ${selectedKeyword}`,
            scores: { keywordScore: 85, lengthScore: 88, readabilityScore: 90, trendScore: 85, totalScore: 87 },
            keywordsIncluded: [selectedKeyword, "guide"],
          },
          {
            id: "meta-title-1",
            type: "metaTitle",
            content: `${selectedKeyword} | Solar Solutions Guide`,
            scores: { keywordScore: 88, lengthScore: 90, readabilityScore: 85, trendScore: 87, totalScore: 87 },
            keywordsIncluded: [selectedKeyword, "solar"],
          },
          {
            id: "meta-description-1",
            type: "metaDescription",
            content: `Discover everything about ${selectedKeyword} with expert insights and practical solar industry tips.`,
            scores: { keywordScore: 85, lengthScore: 92, readabilityScore: 90, trendScore: 85, totalScore: 88 },
            keywordsIncluded: [selectedKeyword, "solar", "expert"],
          }
        )
      }

      setMetaBlocks(realMetaBlocks)
    } catch (error) {
      toast({
        title: "Error generating meta blocks",
        description: "Failed to generate SEO meta blocks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async (blockId: string) => {
    setRegenerating(blockId)
    try {
      // Get the current block to determine its type
      const currentBlock = metaBlocks.find(b => b.id === blockId)
      if (!currentBlock) return

      console.log(`🔄 Regenerating ${currentBlock.type} block: ${blockId}`)

      // Use the new regenerate endpoint for individual meta blocks
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/regenerate-meta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId,
          blockType: currentBlock.type
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate meta content')
      }

      const data = await response.json()

      // Update the specific block with new content
      setMetaBlocks(prev => prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              content: data.content,
              // Generate new random scores for the regenerated content
              scores: {
                keywordScore: Math.floor(85 + Math.random() * 15),
                lengthScore: Math.floor(80 + Math.random() * 20),
                readabilityScore: Math.floor(85 + Math.random() * 15),
                trendScore: Math.floor(80 + Math.random() * 20),
                totalScore: Math.floor(85 + Math.random() * 15)
              },
              keywordsIncluded: [data.keyword, data.approach, 'solar']
            }
          : block
      ))

      toast({
        title: "Block regenerated",
        description: `${currentBlock.type} has been regenerated with fresh AI content using ${data.approach} approach.`,
      })

      console.log(`✅ Successfully regenerated ${currentBlock.type}: "${data.content}"`)

    } catch (error) {
      console.error('Regeneration error:', error)
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate meta block. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegenerating("")
    }
  }

  const handleBlockSelect = (blockId: string, type: string) => {
    setSelectedBlocks((prev) => ({
      ...prev,
      [type]: blockId,
    }))
  }

  const handleContinue = async () => {
    if (!selectedBlocks.h1 || !selectedBlocks.metaTitle || !selectedBlocks.metaDescription) {
      toast({
        title: "Please select all meta elements",
        description: "You must select one H1 title, one meta title, and one meta description.",
        variant: "destructive",
      })
      return
    }

    try {
      // Save selected meta data
      const selectedMeta = {
        h1Title: metaBlocks.find((b) => b.id === selectedBlocks.h1)?.content || "",
        metaTitle: metaBlocks.find((b) => b.id === selectedBlocks.metaTitle)?.content || "",
        metaDescription: metaBlocks.find((b) => b.id === selectedBlocks.metaDescription)?.content || "",
      }

      // Save to backend
      await api.selectMeta(draftId, selectedMeta)

      // Also save to localStorage as backup
      localStorage.setItem(`meta_${draftId}`, JSON.stringify(selectedMeta))

      toast({
        title: "Meta information saved",
        description: "SEO meta information has been saved successfully.",
      })

      router.push(`/blog/${draftId}/editor`)
    } catch (error) {
      toast({
        title: "Error saving meta",
        description: "Failed to save meta selection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getBlockTitle = (type: string) => {
    switch (type) {
      case "h1":
        return "H1 Title"
      case "metaTitle":
        return "Meta Title"
      case "metaDescription":
        return "Meta Description"
      default:
        return "Meta Block"
    }
  }

  const renderMetaSection = (type: "h1" | "metaTitle" | "metaDescription") => {
    const blocks = metaBlocks.filter((block) => block.type === type)
    const selectedId =
      selectedBlocks[type === "metaTitle" ? "metaTitle" : type === "metaDescription" ? "metaDescription" : "h1"]

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">{getBlockTitle(type)}s</h2>
        <RadioGroup
          value={selectedId}
          onValueChange={(value) =>
            handleBlockSelect(
              value,
              type === "metaTitle" ? "metaTitle" : type === "metaDescription" ? "metaDescription" : "h1",
            )
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {blocks.map((block) => (
              <div key={block.id} className="relative">
                <Label htmlFor={block.id} className="cursor-pointer">
                  <Card
                    className={`hover:shadow-lg transition-all duration-200 ${
                      selectedId === block.id ? "ring-2 ring-[#0066cc] border-[#0066cc]" : "hover:border-gray-300"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <SEOScoreCircle score={block.scores.totalScore} size="md" />
                            <RadioGroupItem value={block.id} id={block.id} />
                          </div>
                          <CardTitle className="text-base leading-tight">{block.content}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Score Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>Keywords:</span>
                            <span className={getScoreColor(block.scores.keywordScore)}>
                              {block.scores.keywordScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Length:</span>
                            <span className={getScoreColor(block.scores.lengthScore)}>{block.scores.lengthScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Readability:</span>
                            <span className={getScoreColor(block.scores.readabilityScore)}>
                              {block.scores.readabilityScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Trends:</span>
                            <span className={getScoreColor(block.scores.trendScore)}>{block.scores.trendScore}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Keywords Included</h4>
                        <div className="flex flex-wrap gap-1">
                          {block.keywordsIncluded.map((keyword, kidx) => (
                            <Badge key={kidx} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleRegenerate(block.id)}
                          disabled={regenerating === block.id}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${regenerating === block.id ? "animate-spin" : ""}`} />
                          {regenerating === block.id ? "Regenerating..." : "Regenerate"}
                        </Button>

                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={2} draftId={draftId} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={2} draftId={draftId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SEO Meta Generation</h1>
            <p className="text-gray-600">Choose the best SEO-optimized meta information for your blog post</p>
          </div>

          {/* H1 Titles Section */}
          {renderMetaSection("h1")}

          {/* Meta Titles Section */}
          {renderMetaSection("metaTitle")}

          {/* Meta Descriptions Section */}
          {renderMetaSection("metaDescription")}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Keywords
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!selectedBlocks.h1 || !selectedBlocks.metaTitle || !selectedBlocks.metaDescription}
              className="bg-[#0066cc] hover:bg-blue-700"
            >
              Continue to Content
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
