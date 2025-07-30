const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    console.log('🔥 API Request:', {
      url,
      method: options?.method || 'GET',
      endpoint,
      API_BASE_URL
    });

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

      console.log('📡 API Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ API Response Data:', data);

      return data
    } catch (error) {
      console.error(`❌ API request failed: ${url}`, error)
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

  async generateMetaScores(draftId: string, selectedKeyword?: string) {
    return this.request("/blogs/generate-meta-scores", {
      method: "POST",
      body: JSON.stringify({ draftId, selectedKeyword }),
    })
  }

  async regenerateMeta(draftId: string, blockType: string) {
    return this.request("/blogs/regenerate-meta", {
      method: "POST",
      body: JSON.stringify({ draftId, blockType }),
    })
  }

  async selectMeta(draftId: string, selectedMeta: any) {
    return this.request("/blogs/select-meta", {
      method: "POST",
      body: JSON.stringify({ draftId, selectedMeta }),
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

  async generateImage(prompt: string, style: string = "realistic", imageType: string = "featured") {
    return this.request("/images/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, style, imageType }),
    })
  }

  async saveDraft(draftId: string, draftData: {
    contentBlocks?: any[],
    uploadedImages?: Record<string, string>,
    imagePrompts?: Record<string, string>,
    editedContent?: Record<string, string>,
    wordCount?: number,
    lastModified?: Date
  }) {
    return this.request(`/blogs/draft/${draftId}/save`, {
      method: "PUT",
      body: JSON.stringify(draftData),
    })
  }

  async getDraft(draftId: string) {
    return this.request(`/blogs/draft/${draftId}`)
  }

  async listDrafts() {
    return this.request("/blogs/drafts")
  }

  // FIXED: Pass companyId parameter correctly with debug logs
  async testWordPress(companyId?: string) {
    console.log('🧪 Testing WordPress connection:', {
      companyId: companyId || 'null',
      endpoint: companyId ? `/wordpress/test-connection?companyId=${companyId}` : '/wordpress/test-connection'
    });

    const queryParam = companyId ? `?companyId=${companyId}` : ''
    const endpoint = `/wordpress/test-connection${queryParam}`;
    
    console.log('📡 WordPress test endpoint:', endpoint);
    
    return this.request(endpoint)
  }

  async setupWordPress(companyId: string, baseUrl: string, username: string, appPassword: string) {
    return this.request("/blogs/setup-wordpress", {
      method: "POST",
      body: JSON.stringify({ companyId, baseUrl, username, appPassword }),
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

  async deleteDraft(draftId: string) {
    return this.request(`/blogs/draft/${draftId}`, {
      method: "DELETE",
    })
  }
}

export const api = new ApiClient()