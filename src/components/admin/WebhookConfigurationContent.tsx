import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Webhook, Save, Copy } from 'lucide-react';

interface WebhookConfig {
  id: string;
  workflow_type: string;
  webhook_description: string;
  outbound_webhook_url: string;
  is_active: boolean;
  expected_payload: any;
  documentation: string;
}

interface WebhookTemplate {
  workflow_type: string;
  name: string;
  description: string;
  trigger: string;
  payload_schema: any;
  documentation: string;
}

const webhookTemplates: WebhookTemplate[] = [
  {
    workflow_type: 'company_profile_generated',
    name: 'Generate Company Profile',
    description: 'Triggered when a new company profile is created or updated',
    trigger: 'When a user completes company profile setup or updates profile information',
    payload_schema: {
      user_id: 'string (UUID)',
      profile_id: 'string (UUID)',
      company_name: 'string',
      platform_type: 'string',
      industry: 'string',
      website_url: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp'
    },
    documentation: 'This webhook fires whenever a company profile is created or significantly updated. Use this to sync company data with external CRM systems or trigger automated marketing workflows.'
  },
  {
    workflow_type: 'posts_collection_completed',
    name: 'Research LinkedIn Posts',
    description: 'Triggered when LinkedIn posts collection process is finished',
    trigger: 'When the system completes collecting and analyzing LinkedIn posts for a user',
    payload_schema: {
      user_id: 'string (UUID)',
      collection_id: 'string (UUID)',
      company_name: 'string',
      company_linkedin_url: 'string',
      platform_type: 'string',
      platform: 'string',
      posts_count: 'number',
      date_range_start: 'date',
      date_range_end: 'date',
      status: 'string',
      completed_at: 'timestamp'
    },
    documentation: 'Fires when the LinkedIn posts collection workflow completes. Contains metadata about the collected posts and can be used to trigger follow-up analysis or reporting.'
  },
  {
    workflow_type: 'mascot_generated',
    name: 'Generate Brand Mascot',
    description: 'Triggered when AI generates a brand mascot for a company',
    trigger: 'When the mascot generation process completes successfully',
    payload_schema: {
      user_id: 'string (UUID)',
      profile_id: 'string (UUID)',
      company_name: 'string',
      platform_type: 'string',
      mascot_data: 'object',
      generation_params: 'object',
      image_url: 'string',
      created_at: 'timestamp'
    },
    documentation: 'Triggered when AI mascot generation completes. Contains mascot metadata and image URL for integration with design systems or asset management tools.'
  },
  {
    workflow_type: 'post_content_updated',
    name: 'Revise Post Content',
    description: 'Triggered when AI-generated post content is created or modified',
    trigger: 'When post content is generated, edited, or updated by AI or user',
    payload_schema: {
      user_id: 'string (UUID)',
      post_id: 'string (UUID)',
      company_name: 'string',
      platform_type: 'string',
      content: 'string',
      platform: 'string',
      status: 'string',
      ai_generated: 'boolean',
      updated_at: 'timestamp'
    },
    documentation: 'Fires when post content changes. Use this to sync content with social media management tools or trigger approval workflows.'
  },
  {
    workflow_type: 'post_image_updated',
    name: 'Revise Post Image',
    description: 'Triggered when post images are generated or updated',
    trigger: 'When AI generates new images for posts or user uploads/updates post images',
    payload_schema: {
      user_id: 'string (UUID)',
      post_id: 'string (UUID)',
      company_name: 'string',
      platform_type: 'string',
      image_url: 'string',
      image_type: 'string',
      generation_params: 'object',
      updated_at: 'timestamp'
    },
    documentation: 'Triggered when post images are created or updated. Contains image URLs and metadata for integration with asset management or social media scheduling tools.'
  },
  {
    workflow_type: 'linkedin_post_generated',
    name: 'Generate LinkedIn Post',
    description: 'Triggered when AI generates new LinkedIn post content',
    trigger: 'When the system creates a new LinkedIn post with AI-generated content',
    payload_schema: {
      user_id: 'string (UUID)',
      post_id: 'string (UUID)',
      company_profile_id: 'string (UUID)',
      company_name: 'string',
      platform_type: 'string',
      content: 'string',
      platform: 'string',
      ai_generated: 'boolean',
      generation_params: 'object',
      created_at: 'timestamp'
    },
    documentation: 'Fires when new LinkedIn posts are generated by AI. Contains the generated content and metadata for integration with social media scheduling tools or approval workflows.'
  }
];

export function WebhookConfigurationContent() {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('workflow_type');

      if (error) throw error;

      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching webhook configurations:', error);
      toast.error('Failed to load webhook configurations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (workflowType: string, webhookUrl: string, isActive: boolean) => {
    setSaving(workflowType);
    try {
      const template = webhookTemplates.find(t => t.workflow_type === workflowType);
      if (!template) throw new Error('Template not found');

      const existingConfig = configs.find(c => c.workflow_type === workflowType);

      if (existingConfig) {
        const { error } = await supabase
          .from('webhook_configurations')
          .update({
            outbound_webhook_url: webhookUrl,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('webhook_configurations')
          .insert({
            workflow_type: workflowType,
            webhook_description: template.description,
            outbound_webhook_url: webhookUrl,
            is_active: isActive,
            expected_payload: template.payload_schema,
            documentation: template.documentation,
            inbound_endpoint: '',
            field_mappings: {},
            required_headers: {},
            response_format: {}
          });

        if (error) throw error;
      }

      await fetchConfigurations();
      toast.success('Webhook configuration saved');
    } catch (error) {
      console.error('Error saving webhook configuration:', error);
      toast.error('Failed to save webhook configuration');
    } finally {
      setSaving(null);
    }
  };

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${item} copied to clipboard`);
  };

  const getConfigForTemplate = (workflowType: string) => {
    return configs.find(c => c.workflow_type === workflowType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto" />
          <p className="text-muted-foreground">Loading webhook configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="mr-2 h-5 w-5" />
            Outbound Webhooks
          </CardTitle>
          <CardDescription>
            Configure third-party webhook URLs to receive notifications when specific events occur in your application
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {webhookTemplates.map((template) => {
          const config = getConfigForTemplate(template.workflow_type);
          return (
            <WebhookConfigCard
              key={template.workflow_type}
              template={template}
              config={config}
              onSave={saveConfiguration}
              saving={saving === template.workflow_type}
              onCopy={copyToClipboard}
            />
          );
        })}
      </div>
    </div>
  );
}

interface WebhookConfigCardProps {
  template: WebhookTemplate;
  config?: WebhookConfig;
  onSave: (workflowType: string, webhookUrl: string, isActive: boolean) => void;
  saving: boolean;
  onCopy: (text: string, item: string) => void;
}

function WebhookConfigCard({ template, config, onSave, saving, onCopy }: WebhookConfigCardProps) {
  const [webhookUrl, setWebhookUrl] = useState(config?.outbound_webhook_url || '');
  const [isActive, setIsActive] = useState(config?.is_active || false);

  const handleSave = () => {
    onSave(template.workflow_type, webhookUrl, isActive);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>{template.name}</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="w-full">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="payload">Payload Schema</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor={`webhook-${template.workflow_type}`}>Webhook URL</Label>
                <Input
                  id={`webhook-${template.workflow_type}`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-app.com/webhooks/endpoint"
                  className="mt-1 resize-none"
                />
              </div>
              <div>
                <Label>Trigger Event</Label>
                <p className="text-sm text-muted-foreground mt-1">{template.trigger}</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !webhookUrl.trim()}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payload" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Payload Schema</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(JSON.stringify(template.payload_schema, null, 2), 'Payload schema')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(template.payload_schema).map(([field, type], index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{field}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{type as string}</Badge>
                      </TableCell>
                      <TableCell>
                        {field === 'user_id' && 'Unique identifier of the user'}
                        {field === 'profile_id' && 'Unique identifier of the company profile'}
                        {field === 'post_id' && 'Unique identifier of the post'}
                        {field === 'collection_id' && 'Unique identifier of the posts collection'}
                        {field.includes('_at') && 'Timestamp of the event'}
                        {field === 'status' && 'Current status of the item'}
                        {field === 'platform' && 'Social media platform'}
                        {field.includes('url') && 'URL reference'}
                        {field.includes('count') && 'Numerical count'}
                        {field.includes('data') && 'Data object containing additional information'}
                        {field.includes('params') && 'Parameters used for generation'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Documentation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {template.documentation}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}