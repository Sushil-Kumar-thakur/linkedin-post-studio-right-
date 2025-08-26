import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Wand2, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowRight,
  Check
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Wand2,
      title: "AI-Powered Content Generation",
      description: "Create engaging posts for LinkedIn, Facebook, Twitter, and more with advanced AI"
    },
    {
      icon: Target,
      title: "Brand Voice Learning",
      description: "AI analyzes your existing content to maintain consistent brand voice"
    },
    {
      icon: Calendar,
      title: "Multi-Platform Scheduling",
      description: "Plan and schedule content across all major social media platforms"
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track engagement and optimize your social media strategy"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team to create and approve content"
    },
    {
      icon: Zap,
      title: "Fast Generation",
      description: "Generate high-quality posts in seconds, not hours"
    }
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "3 posts total",
        "LinkedIn platform only",
        "Basic AI templates",
        "Community support",
        "No payment required"
      ],
      popular: false
    },
    {
      name: "Single Platform",
      price: "$39",
      description: "For focused businesses",
      features: [
        "10 posts per month",
        "Choice of 1 platform",
        "Advanced AI templates",
        "Brand voice learning",
        "25% expansion pricing",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Multi Platform",
      price: "$100",
      description: "For growing businesses",
      features: [
        "10 posts per month",
        "Access to 3 platforms",
        "Advanced AI templates",
        "Brand voice learning",
        "Analytics dashboard",
        "25% expansion pricing",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "All Platforms",
      price: "$299",
      description: "For enterprise teams",
      features: [
        "10 posts per month",
        "All social platforms",
        "Advanced AI templates",
        "Brand voice learning",
        "Full analytics suite",
        "25% expansion pricing",
        "Dedicated support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">SocialAI Generator</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30">
            AI-Powered Social Media Content
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            Create Engaging Social Content with AI
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Generate high-quality posts for LinkedIn, Facebook, Twitter, and more. 
            Let AI learn your brand voice and create content that converts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, schedule, and optimize your social media content
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-secondary hover:shadow-primary transition-all">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your social media needs. All plans reset monthly on the 1st.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`shadow-secondary relative ${plan.popular ? 'ring-2 ring-primary shadow-primary' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-brand-success" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth">
                      {plan.name === "Free Trial" ? "Start Free Trial" : "Upgrade Now"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Social Media?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using AI to create engaging social media content
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
            <Link to="/auth">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">SocialAI Generator</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 SocialAI Generator. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
