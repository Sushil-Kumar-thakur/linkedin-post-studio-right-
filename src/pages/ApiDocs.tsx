import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROJECT_URL = 'https://ntggobgawyqglpyhwgsy.supabase.co';

interface EndpointDoc {
  name: string;
  method: string;
  path: string;
  description: string;
  auth: 'bearer' | 'api-key' | 'none';
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  curlExample: string;
  jsonPayload?: string;
  jsonResponse?: string;
  errorCodes?: Array<{
    code: number;
    description: string;
  }>;
}

const endpoints: EndpointDoc[] = [
  {
    name: 'Trigger Brand Voice Analysis',
    method: 'POST',
    path: '/functions/v1/trigger-brand-voice-analysis',
    description: 'Initiates brand voice analysis for a company profile',
    auth: 'bearer',
    parameters: [
      { name: 'company_name', type: 'string', required: true, description: 'Name of the company' },
      { name: 'description', type: 'string', required: false, description: 'Company description' },
      { name: 'industry', type: 'string', required: false, description: 'Industry sector' },
      { name: 'voice_tone', type: 'string', required: false, description: 'Desired voice tone' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/trigger-brand-voice-analysis' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "company_name": "Acme Corp",
    "description": "Leading technology solutions provider",
    "industry": "Technology",
    "voice_tone": "Professional yet approachable"
  }'`,
    jsonPayload: `{
  "company_name": "Acme Corp",
  "description": "Leading technology solutions provider",
  "industry": "Technology", 
  "voice_tone": "Professional yet approachable"
}`,
    jsonResponse: `{
  "success": true,
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Brand voice analysis started successfully"
}`,
    errorCodes: [
      { code: 401, description: 'Unauthorized - Invalid or missing token' },
      { code: 400, description: 'Bad Request - Missing required parameters' }
    ]
  },
  {
    name: 'Trigger N8N Webhook',
    method: 'POST',
    path: '/functions/v1/trigger-n8n-webhook',
    description: 'Triggers external n8n workflow with generation data',
    auth: 'bearer',
    parameters: [
      { name: 'posts', type: 'array', required: true, description: 'Array of generated posts' },
      { name: 'workflow_type', type: 'string', required: false, description: 'Type of workflow to trigger' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/trigger-n8n-webhook' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "posts": [
      {
        "content": "Exciting news from our team!",
        "platform": "linkedin"
      }
    ],
    "workflow_type": "post_generation"
  }'`,
    jsonPayload: `{
  "posts": [
    {
      "content": "Exciting news from our team!",
      "platform": "linkedin"
    }
  ],
  "workflow_type": "post_generation"
}`,
    jsonResponse: `{
  "success": true,
  "execution_id": "n8n_exec_123",
  "message": "Workflow triggered successfully"
}`
  },
  {
    name: 'Receive Generated Posts',
    method: 'POST', 
    path: '/functions/v1/receive-generated-posts',
    description: 'Webhook endpoint for receiving AI-generated posts (API key required)',
    auth: 'api-key',
    parameters: [
      { name: 'posts', type: 'array', required: true, description: 'Array of generated post objects' },
      { name: 'session_id', type: 'string', required: false, description: 'Session identifier' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/receive-generated-posts' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "posts": [
      {
        "content": "🚀 Innovation drives everything we do at Acme Corp...",
        "platform": "linkedin",
        "title": "Innovation at Acme"
      }
    ]
  }'`,
    jsonPayload: `{
  "posts": [
    {
      "content": "🚀 Innovation drives everything we do at Acme Corp...",
      "platform": "linkedin", 
      "title": "Innovation at Acme"
    }
  ],
  "session_id": "optional_session_id"
}`,
    jsonResponse: `{
  "success": true,
  "saved_posts": 1,
  "message": "Posts received and saved successfully"
}`
  },
  {
    name: 'Receive Company Profile',
    method: 'POST',
    path: '/functions/v1/receive-company-profile',
    description: 'Webhook endpoint for receiving AI-analyzed company profile data',
    auth: 'api-key',
    parameters: [
      { name: 'companyName', type: 'string', required: true, description: 'Name of the company to update' },
      { name: 'company_profile_id', type: 'string', required: true, description: 'Company profile ID to update' },
      { name: 'businessOverview', type: 'string', required: false, description: 'Business overview content' },
      { name: 'valueProposition', type: 'string', required: false, description: 'Value proposition content' },
      { name: 'idealCustomerProfile', type: 'string', required: false, description: 'Ideal customer profile content' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/receive-company-profile' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "companyName": "Acme Corp",
    "company_profile_id": "uuid-here",
    "businessOverview": "We are a leading technology company...",
    "valueProposition": "Innovative solutions for modern businesses",
    "idealCustomerProfile": "Enterprise businesses with 100+ employees"
  }'`,
    jsonPayload: `{
  "companyName": "Acme Corp",
  "company_profile_id": "uuid-here",
  "businessOverview": "We are a leading technology company that specializes in innovative solutions for modern businesses. Our team of experts works closely with clients to understand their unique challenges and deliver customized solutions.",
  "valueProposition": "We provide cutting-edge technology solutions that drive business growth and efficiency",
  "idealCustomerProfile": "Enterprise businesses with 100+ employees looking to modernize their technology infrastructure"
}`,
    jsonResponse: `{
  "success": true,
  "message": "Company profile updated successfully",
  "profile": {
    "id": "uuid-here",
    "company_name": "Acme Corp",
    "business_overview": "We are a leading technology company...",
    "value_proposition": "We provide cutting-edge technology solutions...",
    "ideal_customer_profile": "Enterprise businesses with 100+ employees..."
  }
}`
  },
  {
    name: 'AI Copilot Chat',
    method: 'POST',
    path: '/functions/v1/ai-copilot', 
    description: 'Interactive AI assistant for content strategy and optimization',
    auth: 'bearer',
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'User message to the AI' },
      { name: 'conversation_id', type: 'string', required: false, description: 'Conversation thread ID' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/ai-copilot' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": "Help me optimize this LinkedIn post for better engagement",
    "conversation_id": "conv_123"
  }'`,
    jsonPayload: `{
  "message": "Help me optimize this LinkedIn post for better engagement",
  "conversation_id": "conv_123"
}`,
    jsonResponse: `{
  "response": "Here are some suggestions to improve your LinkedIn post engagement...",
  "conversation_id": "conv_123"
}`
  },
  {
    name: 'Create Checkout Session',
    method: 'POST',
    path: '/functions/v1/create-checkout-session',
    description: 'Creates Stripe checkout session for subscription upgrades',
    auth: 'bearer',
    parameters: [
      { name: 'price_id', type: 'string', required: true, description: 'Stripe price ID for the plan' },
      { name: 'success_url', type: 'string', required: false, description: 'Redirect URL after successful payment' }
    ],
    curlExample: `curl -X POST '${PROJECT_URL}/functions/v1/create-checkout-session' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "price_id": "price_1234567890",
    "success_url": "https://yourapp.com/success"
  }'`,
    jsonPayload: `{
  "price_id": "price_1234567890", 
  "success_url": "https://yourapp.com/success"
}`,
    jsonResponse: `{
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "session_id": "cs_test_1234567890"
}`
  }
];

export default function ApiDocs() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const getAuthBadgeColor = (auth: string) => {
    switch (auth) {
      case 'bearer': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'api-key': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'none': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <ProtectedRoute requireOnboarding>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1">
            <div className="container mx-auto p-6 max-w-6xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
                <p className="text-muted-foreground">
                  Complete reference for all API endpoints, including authentication, parameters, and examples.
                </p>
              </div>

              <div className="grid gap-6">
                {endpoints.map((endpoint, index) => (
                  <Card key={index} className="w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {endpoint.method}
                          </Badge>
                          {endpoint.name}
                        </CardTitle>
                        <Badge className={getAuthBadgeColor(endpoint.auth)}>
                          {endpoint.auth === 'bearer' ? 'Bearer Token' : 
                           endpoint.auth === 'api-key' ? 'API Key' : 'Public'}
                        </Badge>
                      </div>
                      <CardDescription>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </CardDescription>
                      <p className="text-sm">{endpoint.description}</p>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="curl" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="request">Request</TabsTrigger>
                          <TabsTrigger value="response">Response</TabsTrigger>
                          <TabsTrigger value="params">Parameters</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="curl" className="space-y-4">
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                              <code>{endpoint.curlExample}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(endpoint.curlExample, `curl-${index}`)}
                            >
                              {copiedItem === `curl-${index}` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="request" className="space-y-4">
                          {endpoint.jsonPayload && (
                            <div className="relative">
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{endpoint.jsonPayload}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(endpoint.jsonPayload!, `request-${index}`)}
                              >
                                {copiedItem === `request-${index}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="response" className="space-y-4">
                          {endpoint.jsonResponse && (
                            <div className="relative">
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{endpoint.jsonResponse}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(endpoint.jsonResponse!, `response-${index}`)}
                              >
                                {copiedItem === `response-${index}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                          
                          {endpoint.errorCodes && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Error Codes</h4>
                              <div className="space-y-2">
                                {endpoint.errorCodes.map((error, errorIndex) => (
                                  <div key={errorIndex} className="flex items-center gap-2">
                                    <Badge variant="destructive">{error.code}</Badge>
                                    <span className="text-sm">{error.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="params" className="space-y-4">
                          {endpoint.parameters ? (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Parameter</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-left p-2">Required</th>
                                    <th className="text-left p-2">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param, paramIndex) => (
                                    <tr key={paramIndex} className="border-b">
                                      <td className="p-2 font-mono text-sm">{param.name}</td>
                                      <td className="p-2">
                                        <Badge variant="secondary">{param.type}</Badge>
                                      </td>
                                      <td className="p-2">
                                        <Badge variant={param.required ? "destructive" : "secondary"}>
                                          {param.required ? "Required" : "Optional"}
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-sm">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No parameters required</p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Authentication Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Bearer Token Authentication</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for user-authenticated endpoints. Obtain from Supabase auth.
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">
                      Authorization: Bearer your_supabase_access_token
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">API Key Authentication</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for webhook endpoints. Configure API keys in admin settings.
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">
                      x-api-key: your_api_key
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Base URL</h4>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">
                      {PROJECT_URL}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}