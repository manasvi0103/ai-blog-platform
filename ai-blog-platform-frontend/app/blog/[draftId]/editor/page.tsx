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
import { Save, Eye, Upload, FileText, ImageIcon, Plus, Target, Type, Hash, Trash2, Link, ExternalLink, RefreshCw, Loader2, Sparkles } from "lucide-react"
import type { BlogBlock } from "@/types/api"
import { StepperHeader } from "@/components/stepper-header"
import { ContentBlock } from "@/components/content-block"
import { api } from "@/lib/api"

interface MetaData {
  h1Title: string
  metaTitle: string
  metaDescription: string
}

export default function EditorPage() {
  const [blocks, setBlocks] = useState<BlogBlock[]>([])
  const [metaData, setMetaData] = useState<MetaData | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<any>(null)
  const [selectedKeyword, setSelectedKeyword] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlogBlock | null>(null)
  const [editContent, setEditContent] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [regenerating, setRegenerating] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [targetWordCount, setTargetWordCount] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentImageBlock, setCurrentImageBlock] = useState<string>("")
  const [generatingImage, setGeneratingImage] = useState<{ [key: string]: boolean }>({})
  const [imagePrompts, setImagePrompts] = useState<{ [key: string]: string }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    loadMetaData()
    loadTargetWordCount() // Now async but we don't need to await
    generateContent()
  }, [])

  useEffect(() => {
    // Calculate total word count
    const total = blocks.reduce((sum, block) => sum + (block.wordCount || 0), 0)
    setWordCount(total)

    // Mark as having unsaved changes when blocks change
    if (blocks.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [blocks])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || blocks.length === 0) return

    const autoSaveInterval = setInterval(() => {
      console.log('🔄 Auto-saving draft...')
      handleSaveDraft()
    }, 3 * 60 * 1000) // Auto-save every 3 minutes

    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges, blocks])

  // Track image changes
  useEffect(() => {
    if (Object.keys(uploadedImages).length > 0 || Object.keys(imagePrompts).length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [uploadedImages, imagePrompts])

  // Keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        handleSaveDraft()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Warn user about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return event.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadMetaData = () => {
    const savedMeta = localStorage.getItem(`meta_${draftId}`)
    if (savedMeta) {
      const parsedMeta = JSON.parse(savedMeta)
      setMetaData(parsedMeta)
      setSelectedMeta(parsedMeta)
      console.log('📋 Loaded selected meta data:', parsedMeta)
    }

    // Load selected keyword
    const savedKeyword = localStorage.getItem(`keyword_${draftId}`)
    if (savedKeyword) {
      setSelectedKeyword(savedKeyword)
      console.log('🎯 Loaded selected keyword:', savedKeyword)
    }
  }

  const loadTargetWordCount = async () => {
    const selectedKeyword = localStorage.getItem(`keyword_${draftId}`)

    if (!selectedKeyword) {
      setTargetWordCount(2500) // default if no keyword
      return
    }

    try {
      // Get the real keyword data from the backend that was used in keyword selection
      const savedKeywordData = localStorage.getItem(`keywordData_${draftId}`)

      if (savedKeywordData) {
        const keywordData = JSON.parse(savedKeywordData)
        console.log('📊 Using saved keyword data for word count:', keywordData)

        if (keywordData.wordCount) {
          const wordCountRange = keywordData.wordCount.replace(/,/g, "")
          const minWords = Number.parseInt(wordCountRange.split("-")[0])
          setTargetWordCount(minWords)
          console.log(`🎯 Set target word count to ${minWords} based on selected keyword "${selectedKeyword}"`)
          return
        }
      }

      // Fallback: try to get from company keywords
      const companyName = localStorage.getItem('selectedCompany')
      if (companyName) {
        const keywords = await api.getKeywords(companyName)
        const keywordData = keywords.find((k: any) => k.focusKeyword === selectedKeyword)

        if (keywordData && keywordData.wordCount) {
          const wordCountRange = keywordData.wordCount.replace(/,/g, "")
          const minWords = Number.parseInt(wordCountRange.split("-")[0])
          setTargetWordCount(minWords)
          console.log(`🎯 Set target word count to ${minWords} from backend keyword data`)
          return
        }
      }

      // Final fallback
      console.log('⚠️ Could not find word count for keyword, using default 2500')
      setTargetWordCount(2500)

    } catch (error) {
      console.error('Error loading target word count:', error)
      setTargetWordCount(2500) // default on error
    }
  }

  const generateContent = async () => {
    try {
      console.log('🤖 Generating structured content...')

      // Call the backend to generate structured content
      const response = await api.generateStructuredContent(draftId) as any

      if (response.success && response.blocks) {
        setBlocks(response.blocks)

        // Set image prompts from the response and auto-generate images
        // Extract image prompts from blocks and set up automatic generation
        const prompts: { [key: string]: string } = {}
        const imageBlocks = response.blocks.filter((block: any) => block.type === 'image')

        imageBlocks.forEach((block: any) => {
          if (block.imagePrompt) {
            prompts[block.id] = block.imagePrompt
          }
        })

        setImagePrompts(prompts)

        // Auto-generate images for all image blocks
        const currentKeyword = localStorage.getItem(`keyword_${draftId}`) || 'selected keyword'
        console.log(`🖼️ Auto-generating ${imageBlocks.length} images for keyword: ${currentKeyword}`)
        console.log('📝 Image prompts:', prompts)

        imageBlocks.forEach((block: any) => {
          if (prompts[block.id]) {
            console.log(`🎨 Auto-generating image for block ${block.id} with prompt: ${prompts[block.id]}`)
            // Small delay between generations to avoid overwhelming the API
            setTimeout(() => {
              handleGenerateImage(block.id)
            }, imageBlocks.indexOf(block) * 2000) // 2 second delay between each
          } else {
            console.warn(`⚠️ No prompt found for image block ${block.id}`)
            // Generate a fallback prompt based on the keyword and block type
            const fallbackPrompt = `Professional ${currentKeyword} related image for solar industry, high quality, modern technology`
            prompts[block.id] = fallbackPrompt
            setImagePrompts(prev => ({ ...prev, [block.id]: fallbackPrompt }))

            setTimeout(() => {
              handleGenerateImage(block.id)
            }, imageBlocks.indexOf(block) * 2000) // 2 second delay between each
          }
        })

        // Get the selected keyword for display
        const selectedKeyword = localStorage.getItem(`keyword_${draftId}`)

        toast({
          title: "🎯 Keyword-Focused Content Generated!",
          description: `AI has generated 9 content blocks specifically for "${selectedKeyword}" - all content, images, and citations focus on this keyword.`,
        })
      } else {
        throw new Error('Failed to generate content')
      }
    } catch (error) {
      console.error('Content generation error:', error)

      // Fallback to mock content if API fails
      console.log('⚠️ Using fallback content due to API error')
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

      toast({
        title: "Using fallback content",
        description: "Generated content using fallback data. Some features may be limited.",
        variant: "default",
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

  const handleGenerateImage = async (blockId: string, prompt?: string) => {
    const imagePrompt = prompt || imagePrompts[blockId]

    if (!imagePrompt) {
      console.warn(`No prompt available for block ${blockId}`)
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for AI image generation.",
        variant: "destructive",
      })
      return
    }

    console.log(`🎨 Generating image for block ${blockId} with prompt: "${imagePrompt}"`)
    setGeneratingImage(prev => ({ ...prev, [blockId]: true }))

    try {
      const result = await api.generateImage(imagePrompt, "realistic") as any
      console.log('🖼️ Image generation result:', result)

      if (result.success) {
        // Fix image URL path handling
        let imageUrl = result.imageUrl

        // Get the backend base URL from the API configuration
        const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'

        // If it's a relative path, make it absolute
        if (imageUrl.startsWith('/uploads/')) {
          imageUrl = `${backendBaseUrl}${imageUrl}`
        }
        // If it doesn't start with http, assume it's relative
        else if (!imageUrl.startsWith('http')) {
          imageUrl = `${backendBaseUrl}/uploads/${imageUrl}`
        }

        setUploadedImages(prev => ({
          ...prev,
          [blockId]: imageUrl
        }))

        console.log(`✅ Image generated successfully for block ${blockId}: ${imageUrl}`)
        toast({
          title: "Image generated successfully",
          description: "AI has generated your image based on the prompt.",
        })
      } else {
        throw new Error(result.error || "Image generation failed")
      }
    } catch (error: any) {
      console.error('Image generation error:', error)

      // Provide specific error messages based on the error type
      let errorMessage = "Failed to generate image. Please try again or upload an image instead."

      if (error.message?.includes('503')) {
        errorMessage = "Image generation service is temporarily unavailable. Please try again in a moment."
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Image generation timed out. Please try again with a simpler prompt."
      } else if (error.message?.includes('failed')) {
        errorMessage = "All image services are currently unavailable. Please try uploading an image instead."
      }

      toast({
        title: "Image generation failed",
        description: errorMessage,
        variant: "destructive",
      })

      // Automatically retry once after a short delay for 503 errors
      if (error.message?.includes('503') && !error.retried) {
        console.log('🔄 Retrying image generation after 503 error...')
        setTimeout(() => {
          const retryError = { ...error, retried: true }
          handleGenerateImage(blockId, prompt).catch(() => {
            // If retry fails, don't show another error toast
            console.log('❌ Retry also failed')
          })
        }, 3000)
      }
    } finally {
      setGeneratingImage(prev => ({ ...prev, [blockId]: false }))
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      console.log('💾 Saving draft with all changes...')

      // Collect all content changes
      const editedContentData: Record<string, string> = {}

      // Get edited content from blocks
      blocks.forEach(block => {
        if (block.content && block.content !== block.originalContent) {
          editedContentData[block.id] = block.content
        }
      })

      // Prepare save data
      const saveData = {
        contentBlocks: blocks,
        uploadedImages: uploadedImages,
        imagePrompts: imagePrompts,
        editedContent: editedContentData,
        wordCount: wordCount,
        lastModified: new Date()
      }

      console.log('📊 Save data:', {
        contentBlocks: blocks.length,
        uploadedImages: Object.keys(uploadedImages).length,
        imagePrompts: Object.keys(imagePrompts).length,
        editedContent: Object.keys(editedContentData).length,
        wordCount: wordCount
      })

      // Save to backend
      const result = await api.saveDraft(draftId, saveData)

      if (result.success) {
        console.log('✅ Draft saved successfully')
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        toast({
          title: "Draft saved",
          description: `Your blog draft has been saved with ${blocks.length} content blocks and ${Object.keys(uploadedImages).length} images.`,
        })
      } else {
        throw new Error(result.message || 'Save failed')
      }

    } catch (error) {
      console.error('Save draft error:', error)
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
      setRegenerating(blockId)

      let response: any;
      if (type === "manual") {
        // Manual content update
        response = await api.regenerateBlock(draftId, blockId, "manual", undefined, editContent)
      } else {
        // AI regeneration with Gemini
        response = await api.regenerateBlock(draftId, blockId, "ai", customPrompt)
      }

      // Update the block with new content and recalculate word count
      const updatedBlocks = blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: response.content,
              wordCount: response.wordCount || response.content?.split(' ').length || 0,
              originalContent: block.originalContent || block.content // Track original for change detection
            }
          : block,
      )

      setBlocks(updatedBlocks)

      // Recalculate total word count
      const newWordCount = updatedBlocks.reduce((total, block) => {
        return total + (block.wordCount || 0)
      }, 0)
      setWordCount(newWordCount)

      setEditingBlock(null)
      setCustomPrompt("")
      toast({
        title: "Block updated",
        description: type === "ai" ? "Content regenerated with AI successfully." : "Content updated manually.",
      })
    } catch (error) {
      console.error('Regeneration error:', error)
      toast({
        title: "Update failed",
        description: "Failed to update content block. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegenerating("")
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
          <div className="space-y-8">
            {/* Loading Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
                <h1 className="text-2xl font-bold text-gray-900">Generating Your Content</h1>
                <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <p className="text-gray-600">AI is creating keyword-focused content blocks, images, and citations...</p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium">Analyzing selected keyword and meta data</span>
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium">Generating 9 content blocks with keyword focus</span>
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium">Creating image prompts and citations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium">Preparing content for editing</span>
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
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
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              className={hasUnsavedChanges ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
            </Button>

            {/* Save status indicator */}
            <div className="text-xs text-gray-500">
              {saving ? (
                <span className="text-blue-600">Saving...</span>
              ) : hasUnsavedChanges ? (
                <span className="text-orange-600">Unsaved changes</span>
              ) : lastSaved ? (
                <span className="text-green-600">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/blog/${draftId}/review`)}
            >
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

      <main className="max-w-none mx-auto">
        {/* WordPress-style editor container */}
        <div className="bg-white min-h-screen">


          {/* WordPress-style content editor */}
          <div className="bg-white border border-gray-300 mx-6 rounded-lg shadow-sm">
            {blocks.map((block, index) => (
              <div key={block.id} className="relative group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                {block.type === "image" ? (
                  <div className="p-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:border-gray-400 transition-colors relative">
                      {/* Delete button for image blocks */}
                      <Button
                        onClick={() => handleDeleteBlock(block.id)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                  {uploadedImages[block.id] ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedImages[block.id]}
                        alt={block.alt || (block.imageType === "feature" ? "Feature image for blog post" : "In-blog illustration")}
                        className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style={{ maxHeight: block.imageType === "feature" ? "400px" : "300px" }}
                        onError={(e) => {
                          console.error('Image load error for path:', uploadedImages[block.id]);
                          console.error('Full URL attempted:', e.currentTarget.src);
                          e.currentTarget.src = "https://via.placeholder.com/800x400/f0f0f0/666666?text=Image+Not+Found";
                        }}
                      />
                      <div className="space-y-3">
                        <Input
                          placeholder="Alt text (required)"
                          value={block.alt || ""}
                          onChange={(e) => {
                            setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, alt: e.target.value } : b)))
                          }}
                          className="max-w-md mx-auto"
                        />
                        <Input
                          placeholder="AI image prompt (e.g., 'Solar panels on modern house roof')"
                          value={imagePrompts[block.id] || ""}
                          onChange={(e) => {
                            setImagePrompts(prev => ({ ...prev, [block.id]: e.target.value }))
                          }}
                          className="max-w-md mx-auto"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleGenerateImage(block.id)}
                            disabled={generatingImage[block.id] || !imagePrompts[block.id]}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {generatingImage[block.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Regenerate AI Image"
                            )}
                          </Button>
                          <Button onClick={() => handleUploadClick(block.id)} variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Image
                          </Button>
                        </div>
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
                        <p className="text-sm text-gray-500 mt-1">Generate AI image or upload your own</p>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Alt text (required)"
                          value={block.alt || ""}
                          onChange={(e) => {
                            setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, alt: e.target.value } : b)))
                          }}
                          className="max-w-md mx-auto"
                        />
                        <Input
                          placeholder="AI image prompt (e.g., 'Solar panels on modern house roof')"
                          value={imagePrompts[block.id] || ""}
                          onChange={(e) => {
                            setImagePrompts(prev => ({ ...prev, [block.id]: e.target.value }))
                          }}
                          className="max-w-md mx-auto"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleGenerateImage(block.id)}
                            disabled={generatingImage[block.id] || !imagePrompts[block.id]}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {generatingImage[block.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate AI Image"
                            )}
                          </Button>
                          <Button onClick={() => handleUploadClick(block.id)} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div className="p-6 relative">
                  {regenerating === block.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
                      <div className="flex items-center gap-2 text-blue-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Regenerating with AI...</span>
                      </div>
                    </div>
                  )}
                  <ContentBlock
                    key={block.id}
                    block={block}
                    onEdit={() => handleEditBlock(block)}
                    onRegenerate={() => handleRegenerateBlock(block.id, "ai")}
                    onDelete={block.editable ? () => handleDeleteBlock(block.id) : undefined}
                    showRegenerateButton={true}
                    selectedKeyword={selectedKeyword}
                  />
                </div>
              )}
              </div>
            ))}
          </div>

          {/* WordPress-style Add Block Section */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Add more content to your blog post</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button onClick={() => handleAddBlock("section")} variant="outline" size="sm" className="text-xs">
                  <Type className="h-3 w-3 mr-1" />
                  Section
                </Button>
                <Button onClick={() => handleAddBlock("image")} variant="outline" size="sm" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Image
                </Button>
                <Button onClick={() => handleAddBlock("conclusion")} variant="outline" size="sm" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Conclusion
                </Button>
                <Button onClick={() => handleAddBlock("introduction")} variant="outline" size="sm" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  Introduction
                </Button>
              </div>
            </div>
          </div>

          {/* WordPress-style Citations Section */}
          <div className="bg-white border border-gray-300 mx-6 mt-8 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Link className="h-4 w-4" />
                References & Links
                {selectedKeyword && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                    Related to "{selectedKeyword}"
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                These authority links are automatically embedded within your content above based on your keyword "{selectedKeyword || 'selected keyword'}".
              </p>
              <div className="space-y-3">
                {/* Real solar-related reference links */}
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <a
                    href="https://www.energy.gov/eere/solar/solar-energy-technologies-office"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mb-1"
                  >
                    U.S. Department of Energy - Solar Energy Technologies Office
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Official government resource on solar energy technologies, research, and development programs.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <a
                    href="https://www.seia.org/solar-industry-research-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mb-1"
                  >
                    Solar Energy Industries Association (SEIA) - Market Research
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Comprehensive solar industry data, market trends, and installation statistics.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <a
                    href="https://www.nrel.gov/solar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mb-1"
                  >
                    National Renewable Energy Laboratory (NREL) - Solar Research
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Leading research institution for solar energy technologies and renewable energy solutions.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <a
                    href="https://www.irena.org/solar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mb-1"
                  >
                    International Renewable Energy Agency (IRENA) - Solar Power
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Global solar energy statistics, cost analysis, and renewable energy transition insights.
                  </p>
                </div>


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

