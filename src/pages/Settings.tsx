import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Moon, 
  Sun, 
  Shield, 
  Key, 
  FileText, 
  ExternalLink,
  Settings as SettingsIcon
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.subscription_tier === 'admin' || profile?.email?.includes('admin');

  useEffect(() => {
    // Check if dark mode is currently active
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const newDarkMode = !isDarkMode;
    
    if (newDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    setIsDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Initialize dark mode from localStorage on app load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const adminLinks = [
    {
      title: 'Admin Panel',
      description: 'Manage users, analytics, and system settings',
      icon: Shield,
      href: '/admin',
      adminOnly: true
    },
    {
      title: 'System Configuration',
      description: 'Configure webhooks, API keys, and system integrations',
      icon: Key,
      href: '/settings/system',
      adminOnly: true
    }
  ];

  const generalLinks = [
    {
      title: 'API Documentation',
      description: 'View comprehensive API documentation and endpoints',
      icon: FileText,
      href: '/api-docs',
      adminOnly: false
    }
  ];

  return (
    <ProtectedRoute requireOnboarding={true}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1">
              {/* Header */}
              <header className="h-16 border-b border-border flex items-center px-6">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">Settings</h1>
                </div>
              </header>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Theme Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                      Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize your application appearance and theme preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="dark-mode" className="text-sm font-medium">
                          Dark Theme
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable dark mode for a better viewing experience in low light
                        </p>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={isDarkMode}
                        onCheckedChange={toggleDarkMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* System Links for Admins */}
                {isAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        System Administration
                      </CardTitle>
                      <CardDescription>
                        Admin-only tools and configuration options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {adminLinks.map((link, index) => (
                        <div key={index}>
                          <Button
                            variant="outline"
                            className="w-full justify-start h-auto p-4"
                            onClick={() => navigate(link.href)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <link.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                              <div className="flex-1 text-left">
                                <div className="font-medium">{link.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {link.description}
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Button>
                          {index < adminLinks.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* General Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentation & Resources
                    </CardTitle>
                    <CardDescription>
                      Access documentation and helpful resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generalLinks.map((link, index) => (
                      <div key={index}>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                          onClick={() => navigate(link.href)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <link.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{link.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {link.description}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Button>
                        {index < generalLinks.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
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