"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, ExternalLink, Settings } from "lucide-react"
import { api } from "@/lib/api"

interface Company {
  id: string
  name: string
  wordpressConfig?: {
    baseUrl?: string
    username?: string
    isActive?: boolean
    connectionStatus?: string
    lastConnectionTest?: string
  }
}

export default function WordPressSetupPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [formData, setFormData] = useState({
    baseUrl: "",
    username: "",
    appPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      // For now, we'll create a test company since the API returns Google Sheets data
      const testCompanies = [
        {
          id: "688229dffa606661ade8ed83", // The company we created earlier
          name: "Test Solar Company",
          wordpressConfig: {
            baseUrl: "",
            username: "",
            isActive: false,
            connectionStatus: "not-tested"
          }
        }
      ]
      setCompanies(testCompanies)
      if (testCompanies.length > 0) {
        setSelectedCompany(testCompanies[0].id)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      })
    }
  }

  const handleSetup = async () => {
    if (!selectedCompany || !formData.baseUrl || !formData.username || !formData.appPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await api.setupWordPress(selectedCompany, formData.baseUrl, formData.username, formData.appPassword)
      
      setConnectionResult(result)
      
      if (result.success) {
        toast({
          title: "WordPress Setup Successful",
          description: "Your WordPress credentials have been saved and tested successfully.",
        })
        loadCompanies() // Refresh companies
      } else {
        toast({
          title: "WordPress Setup Failed",
          description: result.error || "Failed to setup WordPress connection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('WordPress setup error:', error)
      toast({
        title: "Setup Error",
        description: "Failed to setup WordPress connection. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!selectedCompany) return

    setTesting(true)
    try {
      const result = await api.testWordPress(selectedCompany)
      setConnectionResult(result)
      
      if (result.connected) {
        toast({
          title: "Connection Successful",
          description: "WordPress connection is working properly.",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to WordPress",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test WordPress connection",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const selectedCompanyData = companies.find(c => c.id === selectedCompany)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WordPress Integration Setup</h1>
          <p className="text-gray-600">Connect your WordPress site to automatically deploy blog drafts</p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
            <TabsTrigger value="status">Connection Status</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  WordPress Configuration
                </CardTitle>
                <CardDescription>
                  Enter your WordPress site details and application password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company">Select Company</Label>
                  <select
                    id="company"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="baseUrl">WordPress Site URL</Label>
                  <Input
                    id="baseUrl"
                    type="url"
                    placeholder="https://yoursite.com"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="username">WordPress Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="your-username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="appPassword">Application Password</Label>
                  <Input
                    id="appPassword"
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    value={formData.appPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, appPassword: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Generate this in WordPress Admin → Users → Your Profile → Application Passwords
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSetup} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Setting up..." : "Save & Test Connection"}
                  </Button>
                  
                  {selectedCompanyData?.wordpressConfig?.isActive && (
                    <Button 
                      variant="outline" 
                      onClick={testConnection} 
                      disabled={testing}
                    >
                      {testing ? "Testing..." : "Test Connection"}
                    </Button>
                  )}
                </div>

                {connectionResult && (
                  <Alert className={connectionResult.success || connectionResult.connected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {connectionResult.success || connectionResult.connected ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        {connectionResult.success || connectionResult.connected 
                          ? "WordPress connection successful!" 
                          : connectionResult.error || "Connection failed"}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WordPress Setup Guide</CardTitle>
                <CardDescription>Follow these steps to set up WordPress integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-lg">Step 1: Enable Application Passwords</h3>
                    <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                      <li>Go to your WordPress Admin Dashboard</li>
                      <li>Navigate to <strong>Users → Your Profile</strong></li>
                      <li>Scroll down to the <strong>"Application Passwords"</strong> section</li>
                      <li>Enter a name like "AI Blog Platform"</li>
                      <li>Click <strong>"Add New Application Password"</strong></li>
                      <li>Copy the generated password (you won't see it again!)</li>
                    </ol>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-lg">Step 2: Check Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                      <li>WordPress 5.6+ (for built-in Application Passwords)</li>
                      <li>Pretty permalinks enabled (Settings → Permalinks)</li>
                      <li>SSL certificate (recommended for production)</li>
                      <li>User has <strong>edit_posts</strong> capability</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-lg">Step 3: Test Your Setup</h3>
                    <p className="text-sm mt-2">
                      You can test your WordPress REST API manually:
                    </p>
                    <div className="bg-gray-100 p-3 rounded mt-2 text-xs font-mono">
                      curl -X GET https://yoursite.com/wp-json/wp/v2/posts?status=draft \<br/>
                      &nbsp;&nbsp;-H "Authorization: Basic $(echo -n 'USERNAME:APP_PASSWORD' | base64)"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>View the status of all WordPress connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-gray-500">
                          {company.wordpressConfig?.baseUrl || "Not configured"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            company.wordpressConfig?.connectionStatus === 'connected' 
                              ? 'default' 
                              : company.wordpressConfig?.connectionStatus === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {company.wordpressConfig?.connectionStatus || 'not-tested'}
                        </Badge>
                        {company.wordpressConfig?.baseUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(company.wordpressConfig?.baseUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
