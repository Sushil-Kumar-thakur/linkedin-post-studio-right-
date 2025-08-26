import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Copy, Book, Key } from 'lucide-react';

interface EndpointDoc {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  auth: 'Required' | 'Optional' | 'None';
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  exampleRequest: string;
  exampleResponse: string;
  responses: {
    code: number;
    description: string;
  }[];
}

const endpoints: EndpointDoc[] = [
  {
    name: "Get Company Profiles",
    method: "GET",
    path: "/functions/v1/get-company-profiles",
    description: "Retrieve all company profiles for the authenticated user",
    auth: "Required",
    parameters: [],
    exampleRequest: `curl -X GET 'https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/get-company-profiles' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json'`,
    exampleResponse: `{
  "success": true,
  "profiles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "company_name": "Tech Corp",
      "industry": "Technology",
      "website_url": "https://techcorp.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`,
    responses: [
      { code: 200, description: "Success - Returns array of company profiles" },
      { code: 401, description: "Unauthorized - Invalid or missing authentication" },
      { code: 500, description: "Internal Server Error" }
    ]
  },
  {
    name: "Get Company Profile Details",
    method: "GET",
    path: "/functions/v1/get-company-profile-details/{id}",
    description: "Get detailed information for a specific company profile",
    auth: "Required",
    parameters: [
      {
        name: "id",
        type: "string (UUID)",
        required: true,
        description: "The unique identifier of the company profile"
      }
    ],
    exampleRequest: `curl -X GET 'https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/get-company-profile-details/123e4567-e89b-12d3-a456-426614174000' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json'`,
    exampleResponse: `{
  "success": true,
  "profile": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "Tech Corp",
    "industry": "Technology",
    "description": "Leading technology company",
    "website_url": "https://techcorp.com",
    "ai_analysis": {},
    "brand_voice_analysis": {},
    "mascot_data": {},
    "created_at": "2024-01-01T00:00:00Z"
  }
}`,
    responses: [
      { code: 200, description: "Success - Returns detailed company profile" },
      { code: 401, description: "Unauthorized - Invalid or missing authentication" },
      { code: 404, description: "Not Found - Profile doesn't exist or access denied" },
      { code: 500, description: "Internal Server Error" }
    ]
  },
  {
    name: "Update Company Profile",
    method: "POST",
    path: "/functions/v1/update-company-profile",
    description: "Update an existing company profile",
    auth: "Required",
    parameters: [
      {
        name: "id",
        type: "string (UUID)",
        required: true,
        description: "The unique identifier of the company profile"
      },
      {
        name: "company_name",
        type: "string",
        required: false,
        description: "Name of the company"
      },
      {
        name: "industry",
        type: "string",
        required: false,
        description: "Industry sector"
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Company description"
      },
      {
        name: "website_url",
        type: "string",
        required: false,
        description: "Company website URL"
      }
    ],
    exampleRequest: `curl -X POST 'https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/update-company-profile' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "Updated Tech Corp",
    "industry": "Software"
  }'`,
    exampleResponse: `{
  "success": true,
  "profile": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "Updated Tech Corp",
    "industry": "Software",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}`,
    responses: [
      { code: 200, description: "Success - Profile updated successfully" },
      { code: 400, description: "Bad Request - Invalid parameters" },
      { code: 401, description: "Unauthorized - Invalid or missing authentication" },
      { code: 404, description: "Not Found - Profile doesn't exist" },
      { code: 500, description: "Internal Server Error" }
    ]
  },
  {
    name: "AI Copilot Chat",
    method: "POST",
    path: "/functions/v1/ai-copilot",
    description: "Send a message to the AI copilot for assistance",
    auth: "Required",
    parameters: [
      {
        name: "message",
        type: "string",
        required: true,
        description: "The user's message to the AI copilot"
      },
      {
        name: "conversation_id",
        type: "string (UUID)",
        required: false,
        description: "ID of existing conversation (creates new if not provided)"
      }
    ],
    exampleRequest: `curl -X POST 'https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/ai-copilot' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": "Help me create a LinkedIn post about our new product launch",
    "conversation_id": "123e4567-e89b-12d3-a456-426614174000"
  }'`,
    exampleResponse: `{
  "success": true,
  "response": "I'd be happy to help you create a LinkedIn post about your product launch. Here's a suggested post...",
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000"
}`,
    responses: [
      { code: 200, description: "Success - AI response generated" },
      { code: 400, description: "Bad Request - Missing message parameter" },
      { code: 401, description: "Unauthorized - Invalid or missing authentication" },
      { code: 500, description: "Internal Server Error" }
    ]
  },
  {
    name: "Create Stripe Checkout Session",
    method: "POST",
    path: "/functions/v1/create-checkout-session",
    description: "Create a Stripe checkout session for subscription upgrade",
    auth: "Required",
    parameters: [
      {
        name: "priceId",
        type: "string",
        required: true,
        description: "Stripe price ID for the subscription plan"
      },
      {
        name: "successUrl",
        type: "string",
        required: false,
        description: "URL to redirect to after successful payment"
      },
      {
        name: "cancelUrl",
        type: "string",
        required: false,
        description: "URL to redirect to if payment is cancelled"
      }
    ],
    exampleRequest: `curl -X POST 'https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/create-checkout-session' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "priceId": "price_1234567890",
    "successUrl": "https://yourapp.com/success",
    "cancelUrl": "https://yourapp.com/cancel"
  }'`,
    exampleResponse: `{
  "success": true,
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}`,
    responses: [
      { code: 200, description: "Success - Checkout session created" },
      { code: 400, description: "Bad Request - Invalid price ID" },
      { code: 401, description: "Unauthorized - Invalid or missing authentication" },
      { code: 500, description: "Internal Server Error" }
    ]
  }
];

export function ApiDocumentationContent() {
  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${item} copied to clipboard`);
  };

  const getAuthBadgeColor = (auth: string) => {
    switch (auth) {
      case 'Required': return 'destructive';
      case 'Optional': return 'default';
      case 'None': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            All API endpoints require authentication using Bearer tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication Header</h4>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              Authorization: Bearer YOUR_ACCESS_TOKEN
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Content Type</h4>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              Content-Type: application/json
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <div className="space-y-6">
        {endpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                    {endpoint.method}
                  </Badge>
                  <span>{endpoint.name}</span>
                </CardTitle>
                <Badge variant={getAuthBadgeColor(endpoint.auth)}>
                  {endpoint.auth}
                </Badge>
              </div>
              <CardDescription>{endpoint.description}</CardDescription>
              <div className="bg-muted p-2 rounded-md font-mono text-sm">
                {endpoint.path}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="params" className="w-full">
                <TabsList>
                  <TabsTrigger value="params">Parameters</TabsTrigger>
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="space-y-4">
                  {endpoint.parameters.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoint.parameters.map((param, paramIndex) => (
                          <TableRow key={paramIndex}>
                            <TableCell className="font-mono">{param.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{param.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={param.required ? 'destructive' : 'secondary'}>
                                {param.required ? 'Required' : 'Optional'}
                              </Badge>
                            </TableCell>
                            <TableCell>{param.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No parameters required</p>
                  )}
                </TabsContent>

                <TabsContent value="request" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">cURL Example</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.exampleRequest, 'cURL command')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      <code>{endpoint.exampleRequest}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="response" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Response Codes</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoint.responses.map((response, responseIndex) => (
                          <TableRow key={responseIndex}>
                            <TableCell>
                              <Badge variant={response.code === 200 ? 'default' : 'secondary'}>
                                {response.code}
                              </Badge>
                            </TableCell>
                            <TableCell>{response.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Example Response (200)</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.exampleResponse, 'Response JSON')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      <code>{endpoint.exampleResponse}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}