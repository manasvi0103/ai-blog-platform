const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      ...options,
    }

    // Only set Content-Type for non-FormData requests
    if (!(options?.body instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    } else {
      config.headers = {
        ...options?.headers,
      }
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // API methods that make real HTTP requests
  async getCompanies() {
    return this.request("/company")
  }

  async getKeywords(companyName: string) {
    return this.request(`/blogs/keywords/${companyName}`)
  }

  async startBlog(companyName: string) {
    return this.request("/blogs/start", {
      method: "POST",
      body: JSON.stringify({ companyName }),
    })
  }

  async selectKeywordAnalyze(draftId: string, selectedKeyword: string) {
    return this.request("/blogs/select-keyword-analyze", {
      method: "POST",
      body: JSON.stringify({ draftId, selectedKeyword }),
    })
  }

  async generateMetaScores(draftId: string) {
    return this.request("/blogs/generate-meta-scores", {
      method: "POST",
      body: JSON.stringify({ draftId }),
    })
  }

  async selectMeta(draftId: string, selectedMetaIndex: number) {
    return this.request("/blogs/select-meta", {
      method: "POST",
      body: JSON.stringify({ draftId, selectedMetaIndex }),
    })
  }

  async generateStructuredContent(draftId: string) {
    return this.request("/blogs/generate-structured-content", {
      method: "POST",
      body: JSON.stringify({ draftId }),
    })
  }

  async regenerateBlock(
    draftId: string,
    blockId: string,
    regenerationType: "ai" | "manual",
    customPrompt?: string,
    newContent?: string,
  ) {
    return this.request("/blogs/regenerate-block", {
      method: "POST",
      body: JSON.stringify({ draftId, blockId, regenerationType, customPrompt, newContent }),
    })
  }

  async generateLinks(draftId: string) {
    return this.request("/blogs/generate-links", {
      method: "POST",
      body: JSON.stringify({ draftId }),
    })
  }

  async deployWordPress(draftId: string) {
    return this.request("/blogs/deploy-wordpress", {
      method: "POST",
      body: JSON.stringify({ draftId }),
    })
  }

  async getDraft(draftId: string) {
    return this.request(`/blogs/draft/${draftId}`)
  }

  async listDrafts() {
    return this.request("/blogs/drafts")
  }

  async testWordPress(companyId?: string) {
    const url = companyId ? `/blogs/test-wordpress?companyId=${companyId}` : "/blogs/test-wordpress"
    return this.request(url)
  }

  async generateImage(prompt: string, style: string = "realistic") {
    return this.request("/images/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, style }),
    })
  }

  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append("image", file)

    return this.request("/images/upload", {
      method: "POST",
      body: formData,
    })
  }
}

export const api = new ApiClient()
