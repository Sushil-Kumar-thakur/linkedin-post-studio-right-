import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Wand2, Building, LinkIcon, User } from 'lucide-react';

interface OnboardingData {
  companyName: string;
  linkedinCompanyUrl: string;
  linkedinPersonalUrl: string;
  description: string;
}

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    linkedinCompanyUrl: '',
    linkedinPersonalUrl: '',
    description: ''
  });

  // Redirect if not authenticated or onboarding already completed
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateLinkedInUrl = (url: string, type: 'company' | 'personal') => {
    if (!url) return true; // Optional field
    
    const companyPattern = /^https:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-]+\/?$/;
    const personalPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    
    return type === 'company' ? companyPattern.test(url) : personalPattern.test(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        toast.error('Company name is required');
        return;
      }
      
      if (formData.linkedinCompanyUrl && !validateLinkedInUrl(formData.linkedinCompanyUrl, 'company')) {
        toast.error('Please enter a valid LinkedIn company URL');
        return;
      }
      
      if (formData.linkedinPersonalUrl && !validateLinkedInUrl(formData.linkedinPersonalUrl, 'personal')) {
        toast.error('Please enter a valid LinkedIn personal URL');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setLoading(true);
    
    try {
      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: formData.companyName.trim(),
          linkedin_company_url: formData.linkedinCompanyUrl.trim() || null,
          linkedin_personal_url: formData.linkedinPersonalUrl.trim() || null,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Failed to save profile information');
        return;
      }

      // Create company profile
      const { error: companyError } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          company_name: formData.companyName.trim(),
          description: formData.description.trim() || null,
          ai_analysis: {},
          past_posts: []
        });

      if (companyError) {
        console.error('Error creating company profile:', companyError);
        toast.error('Failed to create company profile');
        return;
      }

      // TODO: Trigger brand analysis workflow
      if (formData.linkedinCompanyUrl || formData.linkedinPersonalUrl) {
        try {
          const { data: analysisResult } = await supabase.functions.invoke('analyze-brand', {
            body: {
              linkedinCompanyUrl: formData.linkedinCompanyUrl,
              linkedinPersonalUrl: formData.linkedinPersonalUrl,
              companyName: formData.companyName
            }
          });

          if (analysisResult?.success) {
            // Update company profile with AI analysis
            await supabase
              .from('company_profiles')
              .update({
                ai_analysis: analysisResult.analysis,
                voice_tone: analysisResult.analysis.voiceTone,
                description: analysisResult.analysis.industryInsights
              })
              .eq('user_id', user.id);

            toast.success('Brand analysis completed successfully!');
          }
        } catch (analysisError) {
          console.error('Brand analysis error:', analysisError);
          // Continue with onboarding even if analysis fails
        }
      }
      
      toast.success('Welcome to SocialAI Generator!');
      await refreshProfile();
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Company Information</CardTitle>
            <CardDescription>
              Tell us about your business to personalize your experience
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            name="companyName"
            placeholder="Your company name"
            value={formData.companyName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedinCompanyUrl">LinkedIn Company Page (Optional)</Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="linkedinCompanyUrl"
              name="linkedinCompanyUrl"
              placeholder="https://www.linkedin.com/company/your-company"
              value={formData.linkedinCompanyUrl}
              onChange={handleInputChange}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll analyze your company page to learn your brand voice
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedinPersonalUrl">Your LinkedIn Profile (Optional)</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="linkedinPersonalUrl"
              name="linkedinPersonalUrl"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={formData.linkedinPersonalUrl}
              onChange={handleInputChange}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Help us understand your personal posting style
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleNext}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Brand Voice & Style</CardTitle>
            <CardDescription>
              Help our AI understand your brand personality
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Company Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your company, industry, values, and tone of voice..."
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            This helps our AI generate content that matches your brand voice
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Our AI will analyze your LinkedIn profiles (if provided)</li>
            <li>• We'll learn your brand voice and posting style</li>
            <li>• You can start generating personalized content</li>
            <li>• All data is processed securely and privately</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-glow mb-4">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SocialAI Generator</h1>
          <p className="text-white/80">Let's set up your account to get started</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-6 gap-2">
            <div className={`w-8 h-2 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`w-8 h-2 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <p className="text-white/60 text-sm mt-2">Step {currentStep} of 2</p>
        </div>

        {/* Step Content */}
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
}