import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Building2, BarChart3, Settings, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import SubscriptionCard from '@/components/SubscriptionCard';
import { supabase } from '@/integrations/supabase/client';
import { useProfileForm } from '@/hooks/useProfileForm';

interface CompanyProfile {
  id: string;
  company_name: string;
  industry: string | null;
  description: string | null;
  voice_tone: string | null;
  brand_guidelines: string | null;
  ai_analysis: any;
}

export default function Profile() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [usageData, setUsageData] = useState<any>(null);

  // Use the profile form hook for better state management
  const {
    formData,
    passwordData,
    updateField,
    updatePasswordField,
    clearPasswordForm,
    resetForm
  } = useProfileForm();

  const fetchCompanyProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company profile:', error);
        return;
      }

      setCompanyProfile(data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  useEffect(() => {
    if (profile) {
      const profileData = {
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        linkedin_personal_url: profile.linkedin_personal_url || '',
        linkedin_company_url: profile.linkedin_company_url || ''
      };
      resetForm(profileData);
      
      fetchCompanyProfile();
      fetchUsageData();
    }
  }, [profile, resetForm]);

  const fetchUsageData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage data:', error);
        return;
      }
      
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateField(name as any, value);
  }, [updateField]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updatePasswordField(name as any, value);
  }, [updatePasswordField]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const { error } = await updatePassword(passwordData.newPassword);
      
      if (error) {
        throw error;
      }

      toast.success('Password updated successfully');
      setShowPasswordChange(false);
      clearPasswordForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          linkedin_personal_url: formData.linkedin_personal_url || null,
          linkedin_company_url: formData.linkedin_company_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update or create company profile
      if (formData.company_name) {
        const companyData = {
          user_id: user.id,
          company_name: formData.company_name,
          updated_at: new Date().toISOString()
        };

        const { error: companyError } = await supabase
          .from('company_profiles')
          .upsert(companyData, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (companyError) {
          throw companyError;
        }
      }

      toast.success('Profile updated successfully!');
      await refreshProfile();
      await fetchCompanyProfile();
      
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    setRefreshingAnalysis(true);
    try {
      // This would trigger n8n workflow to re-analyze LinkedIn profiles
      toast.info('Analysis refresh feature coming soon!');
    } finally {
      setRefreshingAnalysis(false);
    }
  };

  return (
    <ProtectedRoute requireOnboarding>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
              <h1 className="text-2xl font-bold">Profile Settings</h1>
            </header>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="text-muted-foreground">
                Manage your account information and preferences
              </div>

            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_personal_url">LinkedIn Personal URL</Label>
                        <Input
                          id="linkedin_personal_url"
                          name="linkedin_personal_url"
                          value={formData.linkedin_personal_url}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Account Overview
                      </CardTitle>
                      <CardDescription>
                        Your subscription and usage information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Plan</Label>
                        <Badge variant="outline" className="capitalize">
                          {profile?.subscription_tier || 'Free Trial'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Generations Used</Label>
                        <span className="text-sm font-medium">
                          {profile?.generations_used || 0} / {profile?.generations_limit || 10}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Member Since</Label>
                        <span className="text-sm text-muted-foreground">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-6">
                <SubscriptionCard usageData={usageData} />
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Password & Security
                    </CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showPasswordChange ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-muted-foreground">Last updated: Never</p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => setShowPasswordChange(true)}
                        >
                          Change Password
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setShowPasswordChange(false);
                              clearPasswordForm();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="company" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                    <CardDescription>
                      Manage your company profile and social media links
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_company_url">LinkedIn Company URL</Label>
                      <Input
                        id="linkedin_company_url"
                        name="linkedin_company_url"
                        value={formData.linkedin_company_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>

                    {/* AI Analysis Results */}
                    {companyProfile?.ai_analysis && Object.keys(companyProfile.ai_analysis).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>AI Brand Analysis</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefreshAnalysis}
                            disabled={refreshingAnalysis}
                          >
                            {refreshingAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Refresh Analysis
                          </Button>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(companyProfile.ai_analysis, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={loading}
                    size="lg"
                    className="min-w-[120px]"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}