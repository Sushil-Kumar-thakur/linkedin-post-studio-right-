import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  Wand2, 
  TrendingUp, 
  Calendar, 
  Users,
  Plus,
  BarChart3,
  Clock
} from 'lucide-react';

interface RecentPost {
  id: string;
  title: string;
  platform: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
  }, []);

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, platform, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setRecentPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-brand-success';
      case 'scheduled':
        return 'bg-brand-warning';
      default:
        return 'bg-muted';
    }
  };

  const getPlatformIcon = (platform: string) => {
    // You can add platform-specific icons here
    return platform.charAt(0).toUpperCase();
  };

  return (
    <ProtectedRoute requireOnboarding>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </header>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-primary rounded-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {profile?.full_name || 'User'}!
                </h2>
                <p className="text-white/90 mb-4">
                  Ready to create some amazing social media content?
                </p>
                <Button className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link to="/generate">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate New Post
                  </Link>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Generations Used
                    </CardTitle>
                    <Wand2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {profile?.generations_used || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {profile?.generations_limit || 10} available
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Posts
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recentPosts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Scheduled Posts
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {recentPosts.filter(p => p.status === 'scheduled').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready to publish
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Engagement Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5.2%</div>
                    <p className="text-xs text-muted-foreground">
                      +0.5% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Posts</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/generate">
                          <Plus className="h-4 w-4 mr-2" />
                          New Post
                        </Link>
                      </Button>
                    </div>
                    <CardDescription>
                      Your latest generated content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentPosts.length > 0 ? (
                      <div className="space-y-4">
                        {recentPosts.map((post) => (
                          <div key={post.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                                {getPlatformIcon(post.platform)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {post.title || 'Untitled Post'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {post.platform}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              className={`${getStatusColor(post.status)} text-white`}
                              variant="secondary"
                            >
                              {post.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start by generating your first social media post
                        </p>
                        <Button asChild>
                          <Link to="/generate">Create First Post</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks to get you started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/generate">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate New Post
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/profile">
                        <Users className="mr-2 h-4 w-4" />
                        Update Company Profile
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/analytics">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule Posts
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Progress */}
              {profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usage & Plan</CardTitle>
                    <CardDescription>
                      Track your current plan usage and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Monthly Generations</span>
                          <span>{profile.generations_used}/{profile.generations_limit}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((profile.generations_used / profile.generations_limit) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <Badge variant="outline" className="capitalize">
                            {profile.subscription_tier} Plan
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile.subscription_tier === 'free' 
                              ? 'Upgrade for unlimited generations'
                              : 'Enjoying unlimited generations'
                            }
                          </p>
                        </div>
                        {profile.subscription_tier === 'free' && (
                          <Button>Upgrade Plan</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}