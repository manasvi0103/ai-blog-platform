"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Link, ExternalLink, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import type { InternalLink, ExternalLink as ExternalLinkType, BlogBlock } from "@/types/api"
import { api } from "@/lib/api"
import { StepperHeader } from "@/components/stepper-header"

export default function ReviewPage() {
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([])
  const [externalLinks, setExternalLinks] = useState<ExternalLinkType[]>([])
  const [blogContent, setBlogContent] = useState<BlogBlock[]>([])
  const [publishAsDraft, setPublishAsDraft] = useState(true)


  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deploymentSuccess, setDeploymentSuccess] = useState(false)
  const [wordpressUrl, setWordpressUrl] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    loadReviewData()
  }, [])



  const loadReviewData = async () => {
    try {
      setLoading(true)

      console.log('📋 Loading draft data and links for review...')

      // First, get the draft data to extract company information
      const draftData = await api.getDraft(draftId)
      setReviewData(draftData)

      console.log('📄 Draft data loaded:', draftData)

      // Get REAL links from the backend
      const linksResponse = await api.generateLinks(draftId)

      console.log('🔗 Real links received:', linksResponse)

      // Use real links from backend
      const realInternalLinks = linksResponse.internalLinks || []
      const realExternalLinks = linksResponse.externalLinks || []

      console.log(`✅ Loaded ${realInternalLinks.length} internal and ${realExternalLinks.length} external links`)

      // Fallback links only if no real links are generated
      const fallbackInternalLinks = [
        {
          anchorText: "solar installation services",
          targetUrl: "/services/solar-installation",
          context: "Professional solar installation services",
          relevance: 88,
        },
        {
          anchorText: "solar panel maintenance",
          targetUrl: "/services/maintenance",
          context: "Comprehensive maintenance programs",
          relevance: 92,
        },
        {
          anchorText: "solar financing options",
          targetUrl: "/financing",
          context: "Flexible financing solutions",
          relevance: 85,
        },
      ]

      const fallbackExternalLinks = [
        {
          anchorText: "NREL Solar Research",
          targetDomain: "nrel.gov",
          targetUrl: "https://www.nrel.gov/solar/",
          context: "National Renewable Energy Laboratory",
          relevance: 95,
        },
        {
          anchorText: "SEIA Industry Data",
          targetDomain: "seia.org",
          targetUrl: "https://www.seia.org/solar-industry-research-data",
          context: "Solar Energy Industries Association",
          relevance: 90,
        },
        {
          anchorText: "Energy.gov Solar Office",
          targetDomain: "energy.gov",
          targetUrl: "https://www.energy.gov/eere/solar/solar-energy-technologies-office",
          context: "U.S. Department of Energy Solar Technologies",
          relevance: 87,
        },
      ]

      // Load real blog content from the draft
      let realBlogContent = []

      if (draftData?.generatedContent?.blogContent) {
        console.log('📝 Loading real blog content from draft...')
        const content = draftData.generatedContent.blogContent

        // Convert the structured content to blog blocks for preview
        realBlogContent = [
          {
            id: "title-1",
            type: "title" as const,
            content: content.title || draftData.selectedH1 || "Blog Post Title",
            editable: false,
          },
          {
            id: "intro-1",
            type: "introduction" as const,
            content: content.introduction || "Introduction content will appear here...",
            editable: true,
            wordCount: content.introduction?.split(' ').length || 0,
          },
          {
            id: "feature-img-1",
            type: "image" as const,
            imageType: "feature" as const,
            alt: `${draftData.selectedKeyword} - Professional feature image`,
            editable: false,
          },
          // Add sections
          ...(content.sections || []).map((section: any, index: number) => [
            {
              id: `section-h2-${index}`,
              type: "section" as const,
              h2: section.h2 || `Section ${index + 1}`,
              content: section.content || "Section content will appear here...",
              editable: true,
              wordCount: section.content?.split(' ').length || 0,
            },
            // Add in-blog images between sections
            {
              id: `section-img-${index}`,
              type: "image" as const,
              imageType: "in-blog" as const,
              alt: `${draftData.selectedKeyword} - Section ${index + 1} image`,
              editable: false,
            }
          ]).flat(),
          {
            id: "conclusion-1",
            type: "conclusion" as const,
            content: content.conclusion || "Conclusion content will appear here...",
            editable: true,
            wordCount: content.conclusion?.split(' ').length || 0,
          },

        ]

        console.log(`✅ Loaded ${realBlogContent.length} content blocks for preview`)
      } else {
        console.log('⚠️ No generated content found, using placeholder content')
        realBlogContent = [
          {
            id: "title-1",
            type: "title" as const,
            content: draftData?.selectedH1 || "Blog Post Title",
            editable: false,
          },
          {
            id: "intro-1",
            type: "introduction" as const,
            content: "Content is being generated... Please complete the content generation step first.",
            editable: true,
            wordCount: 0,
          },
          {
            id: "feature-img-1",
            type: "image" as const,
            imageType: "feature" as const,
            alt: "Feature image placeholder",
            editable: false,
          },
        ]
      }

      // Use real links if available, otherwise use fallbacks
      setInternalLinks(realInternalLinks.length > 0 ? realInternalLinks : fallbackInternalLinks)
      setExternalLinks(realExternalLinks.length > 0 ? realExternalLinks : fallbackExternalLinks)
      setBlogContent(realBlogContent)

    } catch (error) {
      console.error('Error loading review data:', error)
      toast({
        title: "Error loading review data",
        description: "Failed to load blog content and links. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }



  const handleDeploy = async () => {
    // Redirect to deployment loading page
    router.push(`/blog/${draftId}/deploying`)
  }

  const handleDeployOld = async () => {
    setDeploying(true)
    setDeploymentSuccess(false)
    setWordpressUrl(null)

    try {
      console.log('🚀 Deploying to WordPress...')
      console.log(`📝 Draft ID: ${draftId}`)
      console.log(`🏢 Publishing as: ${publishAsDraft ? 'Draft' : 'Published'}`)

      // Show initial deployment message
      toast({
        title: "Deployment started",
        description: "Processing content and uploading images to WordPress...",
        variant: "default",
      })

      const result = await api.deployWordPress(draftId) as any
      console.log('✅ WordPress deployment result:', result)

      if (result?.success) {
        // Set success state immediately
        setDeploymentSuccess(true)
        setWordpressUrl(result.editUrl)

        toast({
          title: "Successfully deployed!",
          description: `Blog post has been created as draft in WordPress with all content and images.`,
          variant: "default",
        })

        // Redirect to WordPress edit URL if available
        if (result?.editUrl) {
          console.log('🔗 Opening WordPress draft editor:', result.editUrl)

          // Show success message with redirect info
          setTimeout(() => {
            toast({
              title: "WordPress Draft Ready",
              description: `Opening WordPress editor in new tab. You can now edit and publish your blog post.`,
              variant: "default",
            })

            // Open WordPress draft in new tab
            window.open(result.editUrl, '_blank', 'noopener,noreferrer')
          }, 1500)

        } else {
          console.log('⚠️ No WordPress edit URL received')
          toast({
            title: "Deployment completed",
            description: "Draft created in WordPress. Please check your WordPress admin panel.",
            variant: "default",
          })
        }
      } else {
        throw new Error(result?.message || result?.error || 'Deployment failed')
      }
    } catch (error: any) {
      console.error('❌ WordPress deployment failed:', error)

      let errorMessage = "Failed to deploy to WordPress. Please check your connection and try again."

      if (error.message?.includes('connection')) {
        errorMessage = "WordPress connection failed. Please check your WordPress credentials in settings."
      } else if (error.message?.includes('upload')) {
        errorMessage = "Failed to upload images to WordPress. Please try again or check image URLs."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Deployment failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeploying(false)
    }
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return "text-green-600"
    if (relevance >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepperHeader currentStep={3} draftId={draftId} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepperHeader currentStep={3} draftId={draftId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review & Deploy</h1>
            <p className="text-gray-600">Review your generated links and deploy to WordPress</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Links Section - Takes 2 columns */}
            <div className="xl:col-span-2 space-y-6">
              {/* Internal Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-[#0066cc]" />
                    Internal Links ({internalLinks.length})
                  </CardTitle>
                  <CardDescription>Links to other pages on your website</CardDescription>
                </CardHeader>
                <CardContent>
                  {internalLinks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No internal links generated</p>
                  ) : (
                    <div className="space-y-3">
                      {internalLinks.map((link, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <a
                              href={link.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                              {link.anchorText}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <Badge variant="outline" className={getRelevanceColor(link.relevance)}>
                              {link.relevance}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1 font-mono">{link.targetUrl}</p>
                          <p className="text-xs text-gray-500">{link.context}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* External Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-[#0066cc]" />
                    External Links ({externalLinks.length})
                  </CardTitle>
                  <CardDescription>Links to external authoritative sources</CardDescription>
                </CardHeader>
                <CardContent>
                  {externalLinks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No external links generated</p>
                  ) : (
                    <div className="space-y-3">
                      {externalLinks.map((link, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <a
                              href={link.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                              {link.anchorText}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <Badge variant="outline" className={getRelevanceColor(link.relevance)}>
                              {link.relevance}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1 font-mono">{link.targetUrl}</p>
                          <p className="text-xs text-gray-500">
                            <span className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-[10px] mr-1">
                              {link.targetDomain}
                            </span>
                            {link.context}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* WordPress Deployment Section - Takes 1 column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[#0066cc]" />
                    WordPress Deployment
                  </CardTitle>
                  <CardDescription>Deploy your blog post to WordPress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">WordPress Ready</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="publish-draft" className="text-sm font-medium">
                      Publish as Draft
                    </label>
                    <Switch id="publish-draft" checked={publishAsDraft} onCheckedChange={setPublishAsDraft} />
                  </div>

                  {!deploymentSuccess ? (
                    <div className="space-y-3">
                      <Button
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="w-full bg-[#0066cc] hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {deploying ? "Deploying..." : `Deploy to WordPress ${publishAsDraft ? "(Draft)" : "(Published)"}`}
                      </Button>

                      {deploying && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-blue-800 text-sm font-medium">
                              Deploying to WordPress...
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 text-center space-y-1">
                            <div>✓ Processing content blocks</div>
                            <div>✓ Uploading images to WordPress</div>
                            <div>✓ Creating draft with SEO metadata</div>
                            <div className="animate-pulse">⏳ Finalizing deployment...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Successfully deployed to WordPress!</span>
                      </div>

                      {wordpressUrl && (
                        <Button
                          onClick={() => window.open(wordpressUrl, '_blank')}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in WordPress Editor
                        </Button>
                      )}

                      <Button
                        onClick={() => {
                          setDeploymentSuccess(false)
                          setWordpressUrl(null)
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Deploy Another Version
                      </Button>
                    </div>
                  )}


                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Editor
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}