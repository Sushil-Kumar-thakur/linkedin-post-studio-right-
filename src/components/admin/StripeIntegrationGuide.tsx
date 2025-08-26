import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeIntegrationGuide() {
  const [testMode, setTestMode] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({
    testPublishableKey: '',
    testSecretKey: '',
    livePublishableKey: '',
    liveSecretKey: '',
    webhookSecret: ''
  });

  const [products, setProducts] = useState([
    { id: '', name: 'Single Platform', priceId: '', amount: 3900 },
    { id: '', name: 'Multi Platform', priceId: '', amount: 10000 },
    { id: '', name: 'All Platforms', priceId: '', amount: 29900 }
  ]);

  const handleKeyChange = (key: string, value: string) => {
    setStripeKeys(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const setupSteps = [
    {
      title: "Create Stripe Account",
      description: "Sign up for a Stripe account if you don't have one",
      completed: false,
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Sign Up
          </a>
        </Button>
      )
    },
    {
      title: "Get API Keys",
      description: "Retrieve your publishable and secret keys from Stripe dashboard",
      completed: false,
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Get Keys
          </a>
        </Button>
      )
    },
    {
      title: "Create Products",
      description: "Set up your subscription products in Stripe",
      completed: false,
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Create Products
          </a>
        </Button>
      )
    },
    {
      title: "Configure Webhooks",
      description: "Set up webhook endpoints for payment notifications",
      completed: false,
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Add Webhook
          </a>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Setup</CardTitle>
          <CardDescription>
            Follow these steps to integrate Stripe payment processing with your application
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <div>
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {step.action}
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys Configuration</CardTitle>
                  <CardDescription>
                    Enter your Stripe API keys. These will be stored securely in Supabase secrets.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={testMode ? "default" : "secondary"}>
                    {testMode ? "Test Mode" : "Live Mode"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Always start with test keys. Only switch to live keys when you're ready for production.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Test Publishable Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="pk_test_..."
                      value={stripeKeys.testPublishableKey}
                      onChange={(e) => handleKeyChange('testPublishableKey', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(stripeKeys.testPublishableKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="sk_test_..."
                      value={stripeKeys.testSecretKey}
                      onChange={(e) => handleKeyChange('testSecretKey', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(stripeKeys.testSecretKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Live Publishable Key (Production Only)</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="pk_live_..."
                      value={stripeKeys.livePublishableKey}
                      onChange={(e) => handleKeyChange('livePublishableKey', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(stripeKeys.livePublishableKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Live Secret Key (Production Only)</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="sk_live_..."
                      value={stripeKeys.liveSecretKey}
                      onChange={(e) => handleKeyChange('liveSecretKey', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(stripeKeys.liveSecretKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Save API Keys to Supabase Secrets
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Products Setup</CardTitle>
              <CardDescription>
                Create these products in your Stripe dashboard with the exact pricing shown below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Products must be created as recurring subscriptions with monthly billing.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="outline">${product.amount / 100}/month</Badge>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Product ID (prod_...)"
                          value={product.id}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].id = e.target.value;
                            setProducts(newProducts);
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Price ID (price_...)"
                          value={product.priceId}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].priceId = e.target.value;
                            setProducts(newProducts);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full">
                Save Product Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Set up webhook endpoints to receive payment notifications from Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your webhook endpoint URL should be: https://your-project.supabase.co/functions/v1/stripe-webhook
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook Endpoint URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value="https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/stripe-webhook"
                      readOnly
                      className="bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("https://ntggobgawyqglpyhwgsy.supabase.co/functions/v1/stripe-webhook")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Events to Listen For</Label>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      customer.subscription.created
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      customer.subscription.updated
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      customer.subscription.deleted
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      invoice.payment_succeeded
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      invoice.payment_failed
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showKeys ? "text" : "password"}
                      placeholder="whsec_..."
                      value={stripeKeys.webhookSecret}
                      onChange={(e) => handleKeyChange('webhookSecret', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(stripeKeys.webhookSecret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Save Webhook Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Your Integration</CardTitle>
              <CardDescription>
                Use these test tools to verify your Stripe integration is working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Test Credit Cards</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Visa (Success):</span>
                      <code>4242 4242 4242 4242</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Visa (Declined):</span>
                      <code>4000 0000 0000 0002</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Mastercard:</span>
                      <code>5555 5555 5555 4444</code>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Test Checkout Flow</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Test a complete checkout process with test data
                  </p>
                  <Button variant="outline" className="w-full">
                    Create Test Checkout Session
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Webhook Testing</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify that webhooks are being received and processed correctly
                  </p>
                  <Button variant="outline" className="w-full">
                    Test Webhook Delivery
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}