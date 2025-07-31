"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Building2, FileText, Clock, Trash2, Play, Loader2 } from "lucide-react"
import type { Company, Draft } from "@/types/api"
import { api } from "@/lib/api"

export default function HomePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingBlog, setStartingBlog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load real data from API
      const [companiesData, draftsData] = await Promise.all([
        api.getCompanies(),
        api.listDrafts()
      ])

      setCompanies(companiesData)
      setDrafts(draftsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error loading data",
        description: "Failed to load companies and drafts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartBlog = async () => {
    if (!selectedCompany) return

    setStartingBlog(true)
    try {
      const response = await api.startBlog(selectedCompany.companyName)
      localStorage.setItem("currentDraftId", response.draftId)
      router.push(`/blog/${response.draftId}/generating-keywords`)
    } catch (error) {
      toast({
        title: "Error starting blog",
        description: "Failed to start new blog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStartingBlog(false)
    }
  }

  const handleResumeDraft = (draft: Draft) => {
    localStorage.setItem("currentDraftId", draft.id)

    // Navigate to the correct step based on currentStep (matching backend workflow)
    let route = `/blog/${draft.id}/keywords` // default

    switch (draft.currentStep) {
      case 1: // keyword_selection
        route = `/blog/${draft.id}/keywords`
        break
      case 2: // meta_generation (auto-generated, go to selection)
      case 3: // meta_selection
        route = `/blog/${draft.id}/meta`
        break
      case 4: // content_review
        route = `/blog/${draft.id}/review`
        break
      case 5: // ready_to_publish
        route = `/blog/${draft.id}/review`
        break
      default:
        route = `/blog/${draft.id}/keywords`
    }

    router.push(route)
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const result = await api.deleteDraft(draftId)
      if (result.success) {
        toast({
          title: "Draft deleted",
          description: "Draft has been removed successfully.",
        })
        loadData() // Refresh the list
      } else {
        throw new Error("Failed to delete draft")
      }
    } catch (error) {
      console.error('Delete draft error:', error)
      toast({
        title: "Error",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStepName = (step: number, draft: any) => {
    const steps = ["Keywords", "Meta Generation", "Meta Selection", "Content Review", "Ready to Publish"]

    // If step 1 and has selected keyword, show "Draft Created"
    if (step === 1 && draft.selectedKeyword) {
      return "Draft Created"
    }

    return steps[step - 1] || "Unknown"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-[#0066cc]">ArticleScribe</h1>
            <p className="text-gray-600">AI Blog Builder with WordPress Deployment</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#0066cc]">ArticleScribe</h1>
          <p className="text-gray-600">AI Blog Builder with WordPress Deployment</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Company Selection */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0066cc]" />
                Select Company
              </CardTitle>
              <CardDescription>Choose a company to start creating your AI-powered blog post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                onValueChange={(value) => {
                  const company = companies.find((c) => c.id === value)
                  setSelectedCompany(company || null)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCompany && (
                <Card className="bg-blue-50 border-[#0066cc]">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-[#0066cc] mb-2">{selectedCompany.companyName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedCompany.aboutTheCompany}</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Services:</strong> {selectedCompany.servicesOffered}
                      </p>
                      <p className="text-sm">
                        <strong>Overview:</strong> {selectedCompany.serviceOverview}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleStartBlog}
                disabled={!selectedCompany || startingBlog}
                className="w-full bg-[#0066cc] hover:bg-blue-700"
                size="lg"
              >
                {startingBlog ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Blog...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start New Blog
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Drafts */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0066cc]" />
              Recent Drafts
            </h2>

            {drafts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Start your first blog post!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{draft.companyName}</CardTitle>
                          <CardDescription className="mt-1">
                            {draft.selectedKeyword || "No keyword selected"}
                          </CardDescription>
                        </div>
                        <Badge variant={draft.status === "published" ? "default" : "secondary"}>{draft.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(draft.lastEdited).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Step {draft.currentStep}: {getStepName(draft.currentStep, draft)}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResumeDraft(draft)}
                          className="flex-1 bg-[#0066cc] hover:bg-blue-700"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                        <Button onClick={() => handleDeleteDraft(draft.id)} variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
