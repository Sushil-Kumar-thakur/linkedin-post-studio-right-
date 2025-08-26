import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChatWidget } from '@/components/ChatWidget';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMascotForm } from '@/hooks/useMascotForm';
import { 
  Upload, 
  Wand2, 
  Info, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Share2,
  ExternalLink,
  Eye,
  Save,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import example mascot images
import exampleRobot from '@/assets/example-mascot-robot.jpg';
import exampleOwl from '@/assets/example-mascot-owl.jpg';
import exampleDog from '@/assets/example-mascot-dog.jpg';

interface CompanyProfile {
  id: string;
  company_name: string;
  website_url: string;
  social_urls: any;
  business_overview?: string;
  ideal_customer_profile?: string;
  value_proposition?: string;
  mascot_image_url?: string;
  mascot_personality?: string;
  brand_voice_analysis?: any;
  selected_reference_posts?: any[];
  mascot_data?: any;
}

interface SocialPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  thumbnail?: string;
  likes: number;
  comments: number;
  shares: number;
  post_date: string;
  author: string;
  external_link?: string;
  engagement_stats: any;
}

interface BrandVoiceSession {
  company_profile_status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  mascot_status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  posts_collection_status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
}

const BrandVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Chat widget state
  const [chatOpen, setChatOpen] = useState(false);

  // Form state with localStorage persistence
  const [formData, setFormData, clearFormData] = useLocalStorage('brandVoice_formData', {
    companyName: '',
    website: '',
    linkedinCompanyUrl: '',
    linkedinPersonalUrl: '',
    facebookPage: '',
    instagramPage: '',
    tiktokPage: '',
    xHandle: '',
    businessOverview: '',
    idealCustomerProfile: '',
    valueProposition: '',
    revisionComments: ''
  });
  
  const [lastSaved, setLastSaved] = useState<string>('');

  // Mascot form state - separate hook for better stability
  const {
    description: mascotDescription,
    mascotImage,
    mascotImagePreview,
    updateDescription: updateMascotDescription,
    handleImageUpload: handleMascotImageUpload,
    isFormValid: isMascotFormValid
  } = useMascotForm();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [sessions, setSessions] = useState<BrandVoiceSession>({
    company_profile_status: 'idle',
    mascot_status: 'idle',
    posts_collection_status: 'idle'
  });
  const [hasGeneratedProfile, setHasGeneratedProfile] = useState(false);

  // Posts state
  const [postsDateRange, setPostsDateRange] = useState('30'); // Default to 30 days
  const [collectedPosts, setCollectedPosts] = useState<SocialPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [detailModalPost, setDetailModalPost] = useState<SocialPost | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  // Load existing company profile data
  useEffect(() => {
    const loadCompanyProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile && !error) {
          setCompanyProfile(profile);
          const socialUrls = profile.social_urls as any;
          setFormData(prev => ({
            ...prev,
            companyName: profile.company_name || '',
            website: profile.website_url || '',
            linkedinCompanyUrl: socialUrls?.linkedin || '',
            linkedinPersonalUrl: socialUrls?.linkedin_personal || '',
            facebookPage: socialUrls?.facebook || '',
            instagramPage: socialUrls?.instagram || '',
            tiktokPage: socialUrls?.tiktok || '',
            xHandle: socialUrls?.x || '',
            businessOverview: profile.business_overview || '',
            idealCustomerProfile: profile.ideal_customer_profile || '',
            valueProposition: profile.value_proposition || ''
          }));
          
          // Check if profile has been generated
          if (profile.business_overview || profile.ideal_customer_profile || profile.value_proposition) {
            setHasGeneratedProfile(true);
            setSessions(prev => ({ ...prev, company_profile_status: 'completed' }));
          }

          // Check if mascot has been generated
          if (profile.mascot_data && typeof profile.mascot_data === 'object' && !Array.isArray(profile.mascot_data) && (profile.mascot_data as any).image_url) {
            setSessions(prev => ({ ...prev, mascot_status: 'completed' }));
          }
        }
      } catch (error) {
        console.error('Error loading company profile:', error);
      }
    };
    
    loadCompanyProfile();
  }, [user, setFormData]);

  // Poll for status updates
  useEffect(() => {
    if (!user) return;
    
    const pollInterval = setInterval(async () => {
      try {
        // Check for company profile updates
        if (sessions.company_profile_status === 'processing') {
          const { data: profile } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile && (profile.business_overview || profile.ideal_customer_profile || profile.value_proposition)) {
            setCompanyProfile(profile);
            setFormData(prev => ({
              ...prev,
              businessOverview: profile.business_overview || '',
              idealCustomerProfile: profile.ideal_customer_profile || '',
              valueProposition: profile.value_proposition || ''
            }));
            setSessions(prev => ({ ...prev, company_profile_status: 'completed' }));
          }
        }

        // Check for mascot generation updates
        if (sessions.mascot_status === 'processing') {
          const { data: profile } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile && profile.mascot_data && typeof profile.mascot_data === 'object' && !Array.isArray(profile.mascot_data) && (profile.mascot_data as any).image_url) {
            setCompanyProfile(profile);
            setSessions(prev => ({ ...prev, mascot_status: 'completed' }));
          }
        }

        // Check for posts collection updates
        if (sessions.posts_collection_status === 'processing') {
          const { data: collections } = await supabase
            .from('social_posts_collection')
            .select('*')
            .eq('user_id', user.id)
            .eq('collection_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (collections && collections.length > 0) {
            const collection = collections[0];
            const posts = (collection.posts_data as unknown) as SocialPost[];
            setCollectedPosts(posts || []);
            setSessions(prev => ({ ...prev, posts_collection_status: 'completed' }));
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [user, sessions, setFormData]);

  // Validation
  const validateLinkedInCompanyUrl = (url: string) => {
    const pattern = /^https:\/\/(www\.)?linkedin\.com\/(company|showcase)\/[a-zA-Z0-9-]+/;
    return pattern.test(url);
  };

  const isFormValid = formData.companyName && formData.website && formData.linkedinCompanyUrl && validateLinkedInCompanyUrl(formData.linkedinCompanyUrl);

  // Handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleMascotImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMascotImageUpload(file);
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const handleGenerateCompanyProfile = async () => {
    setSessions(prev => ({ ...prev, company_profile_status: 'processing' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('trigger-brand-voice-analysis', {
        body: {
          companyName: formData.companyName,
          website: formData.website,
          linkedinCompanyUrl: formData.linkedinCompanyUrl,
          linkedinPersonalUrl: formData.linkedinPersonalUrl,
          socialUrls: {
            facebook: formData.facebookPage,
            instagram: formData.instagramPage,
            tiktok: formData.tiktokPage,
            x: formData.xHandle
          }
        }
      });

      if (error) throw error;

      setHasGeneratedProfile(true);
      toast({
        title: "Analysis Started",
        description: "We're analyzing your company's brand voice. This may take a few minutes."
      });
    } catch (error) {
      console.error('Error generating company profile:', error);
      setSessions(prev => ({ ...prev, company_profile_status: 'error' }));
      toast({
        title: "Error",
        description: "Failed to start company profile analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateMascot = async () => {
    if (!isMascotFormValid) {
      toast({
        title: "Missing Data",
        description: "Please upload a mascot image and provide a description.",
        variant: "destructive"
      });
      return;
    }

    setSessions(prev => ({ ...prev, mascot_status: 'processing' }));

    try {
      // Upload image to Supabase Storage first
      const fileExt = mascotImage.name.split('.').pop();
      const fileName = `${user?.id}-mascot-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mascot-images')
        .upload(fileName, mascotImage);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('trigger-mascot-generation', {
        body: {
          imageUrl: uploadData.path,
          description: mascotDescription
        }
      });

      if (error) throw error;

      toast({
        title: "Mascot Generation Started",
        description: "We're creating your company mascot. This may take a few minutes."
      });
    } catch (error) {
      console.error('Error generating mascot:', error);
      setSessions(prev => ({ ...prev, mascot_status: 'error' }));
      toast({
        title: "Error",
        description: "Failed to start mascot generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRequestRevision = async () => {
    if (!formData.revisionComments.trim()) {
      toast({
        title: "Missing Comments",
        description: "Please provide revision comments.",
        variant: "destructive"
      });
      return;
    }

    setSessions(prev => ({ ...prev, mascot_status: 'processing' }));
    setShowRevisionForm(false);

    try {
      const { data, error } = await supabase.functions.invoke('trigger-mascot-generation', {
        body: {
          imageUrl: companyProfile?.mascot_data?.image_url || '',
          description: mascotDescription,
          revisionComments: formData.revisionComments
        }
      });

      if (error) throw error;

      setFormData(prev => ({ ...prev, revisionComments: '' }));
      toast({
        title: "Revision Started",
        description: "We're revising your company mascot based on your feedback."
      });
    } catch (error) {
      console.error('Error requesting revision:', error);
      setSessions(prev => ({ ...prev, mascot_status: 'error' }));
      toast({
        title: "Error",
        description: "Failed to start mascot revision. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFetchPosts = async () => {
    setSessions(prev => ({ ...prev, posts_collection_status: 'processing' }));

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (parseInt(postsDateRange) * 24 * 60 * 60 * 1000));

      const { data, error } = await supabase.functions.invoke('trigger-posts-collection', {
        body: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          platforms: ['linkedin'],
          linkedinCompanyUrl: formData.linkedinCompanyUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Posts Collection Started",
        description: "We're gathering your past LinkedIn posts."
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      setSessions(prev => ({ ...prev, posts_collection_status: 'error' }));
      toast({
        title: "Error",
        description: "Failed to start posts collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      if (prev.includes(postId)) {
        return prev.filter(id => id !== postId);
      } else if (prev.length < 5) {
        return [...prev, postId];
      } else {
        toast({
          title: "Selection Limit",
          description: "You can select up to 5 posts for reference.",
          variant: "destructive"
        });
        return prev;
      }
    });
  };

  const toggleRowExpansion = (postId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-brand-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Starting...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const filteredPosts = collectedPosts.filter(post => 
    platformFilter === 'all' || post.platform === platformFilter
  ).sort((a, b) => b.likes - a.likes);

  // Check if company profile analysis is done
  const isCompanyProfileComplete = hasGeneratedProfile && 
    sessions.company_profile_status === 'completed' &&
    companyProfile?.business_overview &&
    companyProfile?.ideal_customer_profile &&
    companyProfile?.value_proposition;

  // Check if mascot is already generated
  const isMascotGenerated = companyProfile?.mascot_data && 
    typeof companyProfile.mascot_data === 'object' && 
    !Array.isArray(companyProfile.mascot_data) && 
    (companyProfile.mascot_data as any).image_url;

  // Determine if mascot form should be shown
  const showMascotForm = sessions.mascot_status !== 'processing' && !isMascotGenerated;

  return (
    <ProtectedRoute requireOnboarding>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
              <h1 className="text-2xl font-bold">Company Brand Voice</h1>
            </header>

            {/* Content */}
            <div className="p-6">
              <TooltipProvider>
                <div className="max-w-6xl mx-auto space-y-8">
                  {/* Header Description */}
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Curate and generate content that captures your company's unique voice for better social media posts.
                    </p>
                  </div>

                  {/* Company Information Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          Company Brand Voice Analysis
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>AI-powered analysis of your company's unique voice and positioning</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          AI Copilot
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Generate a comprehensive brand voice analysis using your company information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Overview - Only show if profile hasn't been generated */}
                      {!isCompanyProfileComplete && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border">
                          <h3 className="font-semibold mb-3">What We'll Generate</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Our AI will analyze your company's online presence to create a comprehensive brand voice profile including:
                          </p>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-lg">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Wand2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h4 className="font-medium text-sm mb-2">Business Overview</h4>
                              <p className="text-xs text-muted-foreground">
                                Clear description of what your company does and your market position
                              </p>
                            </div>
                            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-lg">
                              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                              </div>
                              <h4 className="font-medium text-sm mb-2">Customer Profile</h4>
                              <p className="text-xs text-muted-foreground">
                                Detailed profile of your ideal customers and target audience
                              </p>
                            </div>
                            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-lg">
                              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <h4 className="font-medium text-sm mb-2">Value Proposition</h4>
                              <p className="text-xs text-muted-foreground">
                                Your unique value and competitive advantages in the market
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generate Button or Status */}
                      <div className="flex justify-center">
                        {sessions.company_profile_status === 'processing' ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">Status: Processing</span>
                          </div>
                        ) : isCompanyProfileComplete ? null : (
                          <Button
                            onClick={handleGenerateCompanyProfile}
                            disabled={sessions.company_profile_status === 'pending'}
                            className="flex items-center gap-2"
                          >
                            {getStatusIcon(sessions.company_profile_status)}
                            {sessions.company_profile_status === 'idle' ? 'Generate Company Profile' : getStatusText(sessions.company_profile_status)}
                          </Button>
                        )}
                      </div>

                      {/* Company Profile Fields (Only show if populated) */}
                      {(companyProfile?.business_overview || companyProfile?.ideal_customer_profile || companyProfile?.value_proposition) && (
                        <>
                          <Separator />
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">AI-Generated Company Profile</h4>
                              <Badge variant="outline" className="text-xs">
                                Review and Edit
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              Please review the AI-generated information below and make any necessary adjustments to ensure it accurately reflects your brand voice and company positioning.
                            </p>
                            
                            {companyProfile.business_overview && (
                              <div className="space-y-2">
                                <Label htmlFor="business-overview">Business Overview</Label>
                                <Textarea
                                  id="business-overview"
                                  value={formData.businessOverview}
                                  onChange={(e) => handleInputChange('businessOverview', e.target.value)}
                                  placeholder="Describe your business overview..."
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>
                            )}
                            
                            {companyProfile.ideal_customer_profile && (
                              <div className="space-y-2">
                                <Label htmlFor="ideal-customer">Ideal Customer Profile</Label>
                                <Textarea
                                  id="ideal-customer"
                                  value={formData.idealCustomerProfile}
                                  onChange={(e) => handleInputChange('idealCustomerProfile', e.target.value)}
                                  placeholder="Describe your ideal customer..."
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>
                            )}
                            
                            {companyProfile.value_proposition && (
                              <div className="space-y-2">
                                <Label htmlFor="value-proposition">Value Proposition</Label>
                                <Textarea
                                  id="value-proposition"
                                  value={formData.valueProposition}
                                  onChange={(e) => handleInputChange('valueProposition', e.target.value)}
                                  placeholder="Describe your value proposition..."
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Collect Existing LinkedIn Posts Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          Collect Existing LinkedIn Posts
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select up to 5 posts that represent your brand voice</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          AI Copilot
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Gather and analyze your past LinkedIn posts to understand your brand voice
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!isCompanyProfileComplete ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Complete your company profile analysis first to unlock posts collection.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            The AI needs your company information to properly identify and collect relevant social media posts.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Date Range Selector */}
                          <div className="flex items-center gap-4">
                            <Label htmlFor="date-range">Collection Period:</Label>
                            <Select value={postsDateRange} onValueChange={setPostsDateRange}>
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 3 months</SelectItem>
                                <SelectItem value="180">Last 6 months</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                              </SelectContent>
                            </Select>
                            {sessions.posts_collection_status === 'processing' ? (
                              <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                              </div>
                            ) : sessions.posts_collection_status === 'error' ? (
                              <>
                                <Button
                                  onClick={handleFetchPosts}
                                  disabled={false}
                                  className="flex items-center gap-2"
                                >
                                  Fetch Posts
                                </Button>
                                <span className="text-sm text-destructive">Error occurred. Please try again.</span>
                              </>
                            ) : (
                              <Button
                                onClick={handleFetchPosts}
                                disabled={sessions.posts_collection_status === 'pending'}
                                className="flex items-center gap-2"
                              >
                                {getStatusIcon(sessions.posts_collection_status)}
                                Fetch Posts
                              </Button>
                            )}
                          </div>

                          {/* Posts Display */}
                          {collectedPosts.length > 0 && (
                            <>
                              {/* Selection Status */}
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Selected {selectedPosts.length} of 5 posts as Brand Voice Reference
                                </p>
                                <Progress value={(selectedPosts.length / 5) * 100} className="w-32" />
                              </div>

                              {/* Posts Table */}
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead className="w-24">Photo</TableHead>
                                      <TableHead>Post Title</TableHead>
                                      <TableHead>Summary</TableHead>
                                      <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredPosts.map((post) => (
                                      <>
                                        <TableRow key={post.id} className="min-h-[100px]">
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedPosts.includes(post.id)}
                                              onCheckedChange={() => handlePostSelection(post.id)}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            {post.thumbnail ? (
                                              <img
                                                src={post.thumbnail}
                                                alt="Post thumbnail"
                                                className="w-16 h-16 object-cover rounded"
                                              />
                                            ) : (
                                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="font-medium">
                                            {post.title}
                                          </TableCell>
                                          <TableCell className="max-w-md">
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                              {post.content.substring(0, 150)}...
                                            </p>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowExpansion(post.id)}
                                              >
                                                {expandedRows.has(post.id) ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDetailModalPost(post)}
                                              >
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                        {expandedRows.has(post.id) && (
                                          <TableRow>
                                            <TableCell colSpan={5} className="bg-muted/50">
                                              <div className="p-4 space-y-4">
                                                <div>
                                                  <h4 className="font-medium mb-2">Full Content</h4>
                                                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {post.likes} likes
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {post.comments} comments
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <Share2 className="h-3 w-3" />
                                                    {post.shares} shares
                                                  </span>
                                                  <span>by {post.author}</span>
                                                  <span>{new Date(post.post_date).toLocaleDateString()}</span>
                                                </div>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Company Mascot Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          Company Mascot
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload an image and describe your mascot's personality</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          AI Copilot
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Create a unique mascot that represents your brand personality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Example Mascots */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Mascot Inspiration</h4>
                        <p className="text-sm text-muted-foreground">
                          A brand mascot helps humanize your company and creates emotional connections with your audience. Like GEICO's Gecko, a well-designed mascot becomes memorable, builds trust, and makes your brand more approachable and recognizable across all marketing channels.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center space-y-2">
                            <img
                              src={exampleRobot}
                              alt="Example robot mascot"
                              className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <p className="text-xs font-medium">Example: Friendly Robot</p>
                          </div>
                          <div className="text-center space-y-2">
                            <img
                              src={exampleOwl}
                              alt="Example owl mascot"
                              className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <p className="text-xs font-medium">Example: Wise Owl</p>
                          </div>
                          <div className="text-center space-y-2">
                            <img
                              src={exampleDog}
                              alt="Example dog mascot"
                              className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <p className="text-xs font-medium">Example: Loyal Companion</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Generated Mascot Preview */}
                      {isMascotGenerated && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Generated Mascot</h4>
                          <div className="flex items-center gap-6">
                            <img
                              src={(companyProfile.mascot_data as any).image_url}
                              alt="Generated mascot"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <div className="space-y-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowRevisionForm(true)}
                                className="flex items-center gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Request Revision
                              </Button>
                              {showRevisionForm && (
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Describe what you'd like to change about the mascot..."
                                    value={formData.revisionComments}
                                    onChange={(e) => handleInputChange('revisionComments', e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleRequestRevision}
                                      disabled={!formData.revisionComments.trim()}
                                    >
                                      Submit Revision
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowRevisionForm(false)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mascot Generation Status */}
                      {sessions.mascot_status === 'processing' && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Status: Generating</span>
                        </div>
                      )}

                      {/* Mascot Upload Form */}
                      {showMascotForm && (
                        <div className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="mascot-image">Mascot Image</Label>
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                <input
                                  id="mascot-image"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMascotImageChange}
                                  className="hidden"
                                />
                                <label htmlFor="mascot-image" className="cursor-pointer">
                                  {mascotImagePreview ? (
                                    <img
                                      src={mascotImagePreview}
                                      alt="Mascot preview"
                                      className="w-24 h-24 mx-auto mb-2 object-cover rounded"
                                    />
                                  ) : (
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                  )}
                                  <p className="text-sm text-muted-foreground">
                                    {mascotImage ? mascotImage.name : 'Click to upload image'}
                                  </p>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mascot-description">Mascot Description</Label>
                              <Textarea
                                id="mascot-description"
                                value={mascotDescription}
                                onChange={(e) => updateMascotDescription(e.target.value)}
                                placeholder="Describe your mascot's personality, characteristics, and role..."
                                rows={6}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generate Mascot Button */}
                      {showMascotForm && (
                        <div className="flex justify-center">
                          <Button
                            onClick={handleGenerateMascot}
                            disabled={!isMascotFormValid || sessions.mascot_status === 'pending'}
                            className="flex items-center gap-2"
                          >
                            {getStatusIcon(sessions.mascot_status)}
                            {sessions.mascot_status === 'idle' ? 'Generate Company Mascot' : getStatusText(sessions.mascot_status)}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Post Detail Modal */}
                  <Dialog open={!!detailModalPost} onOpenChange={() => setDetailModalPost(null)}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Post Details</DialogTitle>
                        <DialogDescription>
                          Full details of the selected social media post
                        </DialogDescription>
                      </DialogHeader>
                      {detailModalPost && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{detailModalPost.platform}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(detailModalPost.post_date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {detailModalPost.thumbnail && (
                            <img
                              src={detailModalPost.thumbnail}
                              alt="Post thumbnail"
                              className="w-full h-48 object-cover rounded"
                            />
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2">{detailModalPost.title}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{detailModalPost.content}</p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <ThumbsUp className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-sm font-medium">{detailModalPost.likes}</p>
                              <p className="text-xs text-muted-foreground">Likes</p>
                            </div>
                            <div>
                              <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-sm font-medium">{detailModalPost.comments}</p>
                              <p className="text-xs text-muted-foreground">Comments</p>
                            </div>
                            <div>
                              <Share2 className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-sm font-medium">{detailModalPost.shares}</p>
                              <p className="text-xs text-muted-foreground">Shares</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Author: {detailModalPost.author}</Label>
                          </div>
                          
                          {detailModalPost.external_link && (
                            <div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={detailModalPost.external_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Original Post
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Chat Widget */}
                  <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
                </div>
              </TooltipProvider>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default BrandVoice;