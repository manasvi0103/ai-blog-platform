"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Link, ExternalLink, Eye, Smartphone, Monitor, Upload, CheckCircle, AlertCircle } from "lucide-react"
import type { InternalLink, ExternalLink as ExternalLinkType, BlogBlock } from "@/types/api"
import { api } from "@/lib/api"
import { StepperHeader } from "@/components/stepper-header"

export default function ReviewPage() {
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([])
  const [externalLinks, setExternalLinks] = useState<ExternalLinkType[]>([])
  const [blogContent, setBlogContent] = useState<BlogBlock[]>([])
  const [publishAsDraft, setPublishAsDraft] = useState(true)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [wordPressStatus, setWordPressStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const draftId = params.draftId as string

  useEffect(() => {
    loadReviewData()
    checkWordPressConnection()
  }, [])

  const loadReviewData = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock review data
      const mockInternalLinks = [
        {
          anchorText: "business process automation guide",
          targetUrl: "/blog/business-process-automation-complete-guide",
          context: "Learn more about comprehensive business process automation strategies",
          relevance: 92,
        },
        {
          anchorText: "small business CRM solutions",
          targetUrl: "/services/crm-implementation",
          context: "Discover our CRM implementation services for small businesses",
          relevance: 88,
        },
        {
          anchorText: "workflow optimization consulting",
          targetUrl: "/services/workflow-optimization",
          context: "Get expert help optimizing your business workflows",
          relevance: 85,
        },
      ]

      const mockExternalLinks = [
        {
          anchorText: "Zapier automation platform",
          targetDomain: "zapier.com",
          context: "Official Zapier platform for creating automated workflows",
          relevance: 95,
        },
        {
          anchorText: "HubSpot CRM features",
          targetDomain: "hubspot.com",
          context: "Comprehensive overview of HubSpot's CRM capabilities",
          relevance: 90,
        },
        {
          anchorText: "McKinsey AI research report",
          targetDomain: "mckinsey.com",
          context: "Authoritative research on AI adoption in business",
          relevance: 87,
        },
      ]

      const mockBlogContent = [
        {
          id: "intro-1",
          type: "introduction" as const,
          content:
            "In today's fast-paced business environment, small business owners are constantly looking for ways to streamline operations...",
          editable: true,
          wordCount: 124,
        },
        {
          id: "feature-img-1",
          type: "image" as const,
          imageType: "feature" as const,
          alt: "AI automation tools dashboard showing various business processes being automated",
          editable: false,
        },
      ]

      setInternalLinks(mockInternalLinks)
      setExternalLinks(mockExternalLinks)
      setBlogContent(mockBlogContent)
    } catch (error) {
      toast({
        title: "Error loading review data",
        description: "Failed to load blog content and links. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkWordPressConnection = async () => {
    try {
      await api.testWordPress()
      setWordPressStatus("connected")
    } catch (error) {
      setWordPressStatus("disconnected")
    }
  }

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      await api.deployWordPress(draftId)
      toast({
        title: "Successfully deployed!",
        description: `Blog post has been ${publishAsDraft ? "saved as draft" : "published"} to WordPress.`,
        variant: "default",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: "Failed to deploy to WordPress. Please check your connection and try again.",
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Links Section */}
            <div className="space-y-6">
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
                            <h4 className="font-medium text-sm">{link.anchorText}</h4>
                            <Badge variant="outline" className={getRelevanceColor(link.relevance)}>
                              {link.relevance}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{link.targetUrl}</p>
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
                            <h4 className="font-medium text-sm">{link.anchorText}</h4>
                            <Badge variant="outline" className={getRelevanceColor(link.relevance)}>
                              {link.relevance}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{link.targetDomain}</p>
                          <p className="text-xs text-gray-500">{link.context}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WordPress Deployment */}
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
                    {wordPressStatus === "connected" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">WordPress Connected</span>
                      </>
                    ) : wordPressStatus === "disconnected" ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">WordPress Disconnected</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-[#0066cc] rounded-full animate-spin" />
                        <span className="text-sm text-gray-600">Checking connection...</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="publish-draft" className="text-sm font-medium">
                      Publish as Draft
                    </label>
                    <Switch id="publish-draft" checked={publishAsDraft} onCheckedChange={setPublishAsDraft} />
                  </div>

                  <Button
                    onClick={handleDeploy}
                    disabled={deploying || wordPressStatus !== "connected"}
                    className="w-full bg-[#0066cc] hover:bg-blue-700"
                  >
                    {deploying ? "Deploying..." : `Deploy to WordPress ${publishAsDraft ? "(Draft)" : "(Published)"}`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-[#0066cc]" />
                      Blog Preview
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={previewMode === "desktop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("desktop")}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewMode === "mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("mobile")}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>Preview how your blog post will appear on WordPress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border rounded-lg overflow-hidden ${previewMode === "mobile" ? "max-w-sm mx-auto" : ""}`}
                  >
                    <div className="bg-white p-6 space-y-6">
                      {blogContent.map((block, index) => (
                        <div key={block.id}>
                          {block.type === "introduction" && (
                            <div>
                              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                {/* This would be the H1 title from meta */}
                                Blog Post Title
                              </h1>
                              <div className="prose prose-sm max-w-none text-gray-700">{block.content}</div>
                            </div>
                          )}

                          {block.type === "image" && block.imageType === "feature" && (
                            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Feature Image</p>
                                {block.alt && <p className="text-xs text-gray-400 mt-1">{block.alt}</p>}
                              </div>
                            </div>
                          )}

                          {block.type === "section" && (
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 mb-3">{block.h2}</h2>
                              <div className="prose prose-sm max-w-none text-gray-700">{block.content}</div>
                            </div>
                          )}

                          {block.type === "image" && block.imageType === "in-blog" && (
                            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center my-4">
                              <div className="text-center">
                                <Eye className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">In-blog Image</p>
                              </div>
                            </div>
                          )}

                          {block.type === "conclusion" && (
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 mb-3">Conclusion</h2>
                              <div className="prose prose-sm max-w-none text-gray-700">{block.content}</div>
                            </div>
                          )}

                          {block.type === "references" && (
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 mb-3">References</h2>
                              <div className="prose prose-sm max-w-none text-gray-700">{block.content}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
