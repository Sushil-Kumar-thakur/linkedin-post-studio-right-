import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Crown, Users, Globe, CheckCircle } from 'lucide-react';

interface SubscriptionCardProps {
  usageData?: {
    postsUsed: number;
    postsLimit: number;
    trialPostsUsed: number;
    isTrialUser: boolean;
    platformAccess: Record<string, boolean>;
  };
}

export default function SubscriptionCard({ usageData }: SubscriptionCardProps) {
  const { profile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const plans = [
    {
      id: 'single',
      name: 'Single Platform',
      price: 39,
      description: 'Perfect for focused growth',
      icon: Crown,
      features: ['1 Platform Choice', '10 Posts/Month', 'AI Generation', 'Analytics'],
      popular: false
    },
    {
      id: 'multi',
      name: 'Multi Platform',
      price: 100,
      description: 'Scale across channels',
      icon: Users,
      features: ['3 Platforms', '10 Posts/Month', 'AI Generation', 'Analytics', 'Priority Support'],
      popular: true
    },
    {
      id: 'all',
      name: 'All Platforms',
      price: 299,
      description: 'Maximum reach & impact',
      icon: Globe,
      features: ['All Platforms', '10 Posts/Month', 'AI Generation', 'Analytics', 'Priority Support', 'Custom Integrations'],
      popular: false
    }
  ];

  const handleUpgrade = async (planType: string) => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planType, postExpansions: 0 }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast.success('Redirecting to checkout...');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create checkout session');
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentPlan = (profile as any)?.platform_plan || 'free';
  const isTrialUser = (profile as any)?.is_trial_user ?? true;

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      {isTrialUser && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Free Trial
            </CardTitle>
            <CardDescription>
              You're currently on a free trial with LinkedIn access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trial Posts Used</span>
                <span>{usageData?.trialPostsUsed || 0}/3</span>
              </div>
              <Progress 
                value={((usageData?.trialPostsUsed || 0) / 3) * 100} 
                className="h-2"
              />
            </div>
            {(usageData?.trialPostsUsed || 0) >= 2 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  You're almost out of trial posts! Upgrade to continue creating content.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <Icon className="h-8 w-8 mx-auto text-primary" />
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upgrade to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Post Expansion */}
      {!isTrialUser && (
        <Card>
          <CardHeader>
            <CardTitle>Need More Posts?</CardTitle>
            <CardDescription>
              Add extra posts to your plan for 25% of your base price per 10 posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Current usage: {usageData?.postsUsed || 0}/{usageData?.postsLimit || 10} posts this month
                </p>
                <Progress 
                  value={((usageData?.postsUsed || 0) / (usageData?.postsLimit || 10)) * 100} 
                  className="h-2 mt-2"
                />
              </div>
              <Button variant="outline" disabled>
                Add +10 Posts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}