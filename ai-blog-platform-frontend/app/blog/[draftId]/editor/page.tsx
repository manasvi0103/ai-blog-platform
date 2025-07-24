"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Save, Eye, Upload, FileText, ImageIcon, Plus, Target, Type, Hash, Trash2 } from "lucide-react"
import type { BlogBlock } from "@/types/api"
import { StepperHeader } from "@/components/stepper-header"
import { ContentBlock } from "@/components/content-block"

interface MetaData {
  h1Title: string
  metaTitle: string
  metaDescription: string
}

export default function EditorPage() {
  const [blocks, setBlocks] = useState<BlogBlock[]>([])
  const [metaData, setMetaData] = useState<MetaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlogBlock | null>(null)
  const [editContent, setEditContent] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [targetWordCount, setTargetWordCount] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentImageBlock, setCurrentImageBlock] = useState<string>("")
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    loadMetaData()
    loadTargetWordCount()
    generateContent()
  }, [])

  useEffect(() => {
    // Calculate total word count
    const total = blocks.reduce((sum, block) => sum + (block.wordCount || 0), 0)
    setWordCount(total)
  }, [blocks])

  const loadMetaData = () => {
    const savedMeta = localStorage.getItem(`meta_${draftId}`)
    if (savedMeta) {
      setMetaData(JSON.parse(savedMeta))
    }
  }

  const loadTargetWordCount = () => {
    const selectedKeyword = localStorage.getItem(`keyword_${draftId}`)
    // Mock keywords data to get word count
    const keywords = [
      { focusKeyword: "AI automation tools for small business", wordCount: "2,500-3,000" },
      { focusKeyword: "Best workflow automation software 2024", wordCount: "3,500-4,000" },
      { focusKeyword: "Machine learning integration guide", wordCount: "4,000-5,000" },
      { focusKeyword: "Digital transformation strategies", wordCount: "2,000-2,500" },
    ]

    const keywordData = keywords.find((k) => k.focusKeyword === selectedKeyword)
    if (keywordData) {
      const wordCountRange = keywordData.wordCount.replace(/,/g, "")
      const minWords = Number.parseInt(wordCountRange.split("-")[0])
      setTargetWordCount(minWords)
    } else {
      setTargetWordCount(2500) // default
    }
  }

  const generateContent = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate blocks that total to the target word count
      const mockBlocks = [
        {
          id: "feature-img-1",
          type: "image" as const,
          imageType: "feature" as const,
          alt: "AI automation tools dashboard showing various business processes being automated",
          editable: false,
        },
        {
          id: "intro-1",
          type: "introduction" as const,
          content:
            "In today's fast-paced business environment, small business owners are constantly looking for ways to streamline operations, reduce manual tasks, and focus on what matters most - growing their business. AI automation tools have emerged as game-changers, offering sophisticated solutions that were once only available to large enterprises.\n\nThis comprehensive guide will walk you through the best AI automation tools specifically designed for small businesses, helping you understand how to implement them effectively and maximize your return on investment. Whether you're looking to automate customer service, marketing campaigns, or internal processes, we've got you covered.",
          editable: true,
          wordCount: 124,
        },
        {
          id: "section-1",
          type: "section" as const,
          h2: "What Are AI Automation Tools and Why Do Small Businesses Need Them?",
          content:
            "AI automation tools are software solutions that use artificial intelligence to perform tasks that typically require human intervention. These tools can analyze data, make decisions, and execute actions based on predefined rules or learned patterns.\n\nFor small businesses, AI automation offers several key benefits:\n\n• **Cost Reduction**: Automate repetitive tasks to reduce labor costs\n• **Improved Accuracy**: Minimize human errors in data processing and analysis\n• **24/7 Operations**: Keep critical processes running around the clock\n• **Scalability**: Handle increased workload without proportional staff increases\n• **Competitive Advantage**: Access enterprise-level capabilities at affordable prices\n\nThe key is choosing the right tools that align with your specific business needs and budget constraints.\n\n[Learn more about business process automation](https://example.com/business-automation) to understand how these tools can transform your operations.",
          editable: true,
          wordCount: 156,
        },
        {
          id: "inblog-img-1",
          type: "image" as const,
          imageType: "in-blog" as const,
          alt: "Comparison chart showing different AI automation tools and their features",
          editable: false,
        },
        {
          id: "section-2",
          type: "section" as const,
          h2: "Top 5 AI Automation Tools for Small Business Operations",
          content:
            "After extensive research and testing, we've identified the top AI automation tools that deliver exceptional value for small businesses:\n\n**1. Zapier with AI Features**\nZapier's AI-powered automation connects over 5,000 apps, making it easy to create complex workflows without coding. Recent AI enhancements include smart suggestions and natural language processing for trigger creation. [Visit Zapier](https://zapier.com) to explore their automation capabilities.\n\n**2. HubSpot's AI-Powered CRM**\nHubSpot offers AI-driven lead scoring, predictive analytics, and automated email sequences. Their free tier makes it accessible for startups and growing businesses.\n\n**3. Chatfuel for Customer Service**\nThis AI chatbot platform handles customer inquiries 24/7, reducing response times and freeing up your team for more complex tasks.\n\n**4. Calendly with Smart Scheduling**\nAI-powered scheduling that learns from your preferences and automatically optimizes meeting times based on participant availability and preferences.\n\n**5. QuickBooks AI for Financial Management**\nAutomated expense categorization, invoice processing, and financial forecasting powered by machine learning algorithms.\n\nAccording to [McKinsey's latest research](https://mckinsey.com/ai-business-impact), companies implementing AI automation see an average 15% increase in productivity within the first year.",
          editable: true,
          wordCount: 189,
        },
        {
          id: "section-3",
          type: "section" as const,
          h2: "Implementation Strategy: How to Successfully Deploy AI Automation",
          content:
            "Successfully implementing AI automation in your small business requires a strategic approach:\n\n**Phase 1: Assessment and Planning (Week 1-2)**\n• Identify repetitive, time-consuming tasks\n• Map current workflows and processes\n• Set clear goals and success metrics\n• Determine budget and resource allocation\n\n**Phase 2: Tool Selection and Setup (Week 3-4)**\n• Research and compare automation tools\n• Start with free trials or basic plans\n• Configure initial automations for low-risk processes\n• Train team members on new tools\n\n**Phase 3: Testing and Optimization (Week 5-8)**\n• Monitor automation performance closely\n• Gather feedback from team members\n• Make adjustments and improvements\n• Gradually expand to more complex processes\n\n**Phase 4: Scale and Advanced Features (Month 3+)**\n• Implement more sophisticated automations\n• Integrate multiple tools for comprehensive workflows\n• Analyze ROI and adjust strategy as needed\n• Explore advanced AI features and capabilities\n\nFor more detailed guidance, check out our [workflow optimization services](/services/workflow-optimization) to get expert help with your automation journey.",
          editable: true,
          wordCount: 178,
        },
        {
          id: "conclusion-1",
          type: "conclusion" as const,
          content:
            "AI automation tools are no longer a luxury reserved for large corporations – they're essential for small businesses looking to compete and thrive in today's digital landscape. By starting with simple automations and gradually expanding your capabilities, you can transform your operations, reduce costs, and focus on what you do best: serving your customers and growing your business.\n\nRemember, the key to successful AI automation is starting small, measuring results, and continuously optimizing your processes. Choose tools that integrate well with your existing systems, provide excellent support, and offer room for growth as your business expands.\n\nReady to get started? Begin by identifying one repetitive task in your business and explore how AI automation can help you reclaim those valuable hours for more strategic activities.\n\n**Sources:**\n1. McKinsey Global Institute - \"The Age of AI\" Report\n2. Zapier Automation Statistics 2024\n3. HubSpot State of Marketing Report\n4. Small Business Administration Technology Adoption Survey",
          editable: true,
          wordCount: 142,
        },
      ]

      setBlocks(mockBlocks)
    } catch (error) {
      toast({
        title: "Error generating content",
        description: "Failed to generate blog content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && currentImageBlock) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setUploadedImages((prev) => ({
          ...prev,
          [currentImageBlock]: imageUrl,
        }))
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = (blockId: string) => {
    setCurrentImageBlock(blockId)
    fileInputRef.current?.click()
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Draft saved",
        description: "Your blog draft has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReviewAndDeploy = () => {
    router.push(`/blog/${draftId}/review`)
  }

  const handleEditBlock = (block: BlogBlock) => {
    setEditingBlock(block)
    setEditContent(block.content || "")
    setCustomPrompt("")
  }

  const handleRegenerateBlock = async (blockId: string, type: "ai" | "manual") => {
    try {
      const mockResponse = {
        newContent:
          type === "manual"
            ? editContent
            : `This is regenerated content for block ${blockId}. ${customPrompt ? `Based on prompt: ${customPrompt}` : "Generated with AI."}`,
        wordCount: type === "manual" ? editContent.split(" ").length : Math.floor(Math.random() * 100) + 50,
      }

      setBlocks(
        blocks.map((block) =>
          block.id === blockId
            ? { ...block, content: mockResponse.newContent, wordCount: mockResponse.wordCount }
            : block,
        ),
      )

      setEditingBlock(null)
      toast({
        title: "Block updated",
        description: "Content block has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update content block. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((block) => block.id !== blockId))
    toast({
      title: "Block deleted",
      description: "Content block has been removed.",
    })
  }

  const handleAddBlock = (type: string) => {
    const newBlock: BlogBlock = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      content: type === "section" ? "New section content..." : "New content...",
      h2: type === "section" ? "New Section Title" : undefined,
      imageType: type === "image" ? "in-blog" : undefined,
      alt: type === "image" ? "New image" : undefined,
      editable: true,
      wordCount: type === "image" ? 0 : 50,
    }

    setBlocks([...blocks, newBlock])
    toast({
      title: "Block added",
      description: `New ${type} block has been added to your content.`,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={3} draftId={draftId} />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={3} draftId={draftId} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Content Editor</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {wordCount} / {targetWordCount} words
            </Badge>
            <Badge variant={wordCount >= targetWordCount ? "default" : "secondary"}>
              {wordCount >= targetWordCount ? "Target Reached" : "In Progress"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSaveDraft} disabled={saving} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>

            <Button onClick={handleReviewAndDeploy} className="bg-[#0066cc] hover:bg-blue-700" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Review & Deploy
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Meta Information Display */}
          {metaData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-blue-900">SEO Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-800">H1 Title:</label>
                  <p className="text-blue-900 font-semibold">{metaData.h1Title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-800">Meta Title:</label>
                  <p className="text-blue-900">{metaData.metaTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-800">Meta Description:</label>
                  <p className="text-blue-900">{metaData.metaDescription}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content Blocks */}
          {blocks.map((block, index) => (
            <div key={block.id}>
              {block.type === "image" ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:border-gray-400 transition-colors relative">
                  {/* Delete button for image blocks */}
                  <Button
                    onClick={() => handleDeleteBlock(block.id)}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {uploadedImages[block.id] ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedImages[block.id] || "/placeholder.svg"}
                        alt={block.alt || "Uploaded image"}
                        className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style={{ maxHeight: block.imageType === "feature" ? "400px" : "300px" }}
                      />
                      <div className="flex items-center justify-center gap-4">
                        <Button onClick={() => handleUploadClick(block.id)} variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Image
                        </Button>
                        <Input
                          placeholder="Alt text (required)"
                          value={block.alt || ""}
                          onChange={(e) => {
                            setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, alt: e.target.value } : b)))
                          }}
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {block.imageType === "feature" ? "Feature Image" : "In-blog Image"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Upload an image for your blog post</p>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Alt text (required)"
                          value={block.alt || ""}
                          onChange={(e) => {
                            setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, alt: e.target.value } : b)))
                          }}
                          className="max-w-md mx-auto"
                        />
                        <Button onClick={() => handleUploadClick(block.id)} className="bg-[#0066cc] hover:bg-blue-700">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ContentBlock
                  key={block.id}
                  block={block}
                  onEdit={() => handleEditBlock(block)}
                  onRegenerate={() => handleRegenerateBlock(block.id, "ai")}
                  onDelete={block.editable ? () => handleDeleteBlock(block.id) : undefined}
                  showRegenerateButton={false}
                />
              )}
            </div>
          ))}

          {/* Add Block Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:border-gray-400 transition-colors">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add New Block</h3>
                <p className="text-sm text-gray-500 mt-1">Add more content to your blog post</p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={() => handleAddBlock("section")} variant="outline" size="sm">
                  <Type className="h-4 w-4 mr-2" />
                  Section
                </Button>
                <Button onClick={() => handleAddBlock("image")} variant="outline" size="sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button onClick={() => handleAddBlock("conclusion")} variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Conclusion
                </Button>
                <Button onClick={() => handleAddBlock("introduction")} variant="outline" size="sm">
                  <Hash className="h-4 w-4 mr-2" />
                  Introduction
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {/* Edit Modal */}
        <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Content Block</DialogTitle>
              <DialogDescription>
                Modify the content manually or use AI to regenerate with a custom prompt
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">AI Regeneration Prompt (Optional)</label>
                <Input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Make it more engaging, Add statistics, Simplify for beginners..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleRegenerateBlock(editingBlock?.id || "", "manual")} className="flex-1">
                  Save Manual Changes
                </Button>

                <Button
                  onClick={() => handleRegenerateBlock(editingBlock?.id || "", "ai")}
                  disabled={!customPrompt}
                  variant="outline"
                  className="flex-1"
                >
                  Regenerate with AI
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
