import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useTimeout } from '@/hooks/useTimeout';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  UserCheck,
  UserX,
  Activity,
  Database,
  Loader2,
  RefreshCw,
  AlertCircle,
  Webhook,
  Key,
  Book
} from 'lucide-react';
import { WebhookConfigurationContent } from '@/components/admin/WebhookConfigurationContent';
import { ApiKeysContent } from '@/components/admin/ApiKeysContent';
import { ApiDocumentationContent } from '@/components/admin/ApiDocumentationContent';

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    company_name: string | null;
    subscription_tier: string;
    generations_used: number;
    generations_limit: number;
  } | null;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalGenerations: number;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalGenerations: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Use timeout hooks for different operations
  const adminCheck = useTimeout(
    async () => {
      if (!user) throw new Error('No user found');
      
      logger.debug('Checking admin status', {
        componentName: 'Admin',
        userId: user.id,
        action: 'admin_check'
      });

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        logger.error('Admin check query failed', {
          componentName: 'Admin',
          userId: user.id,
          data: { error: error.message }
        });
        throw error;
      }

      const isAdminUser = !!data;
      logger.info(`Admin check completed: ${isAdminUser}`, {
        componentName: 'Admin',
        userId: user.id,
        data: { isAdmin: isAdminUser }
      });

      setIsAdmin(isAdminUser);
      return isAdminUser;
    },
    {
      timeout: 10000,
      componentName: 'Admin',
      operation: 'admin_check',
      onTimeout: (errorCode) => {
        setAdminError(`Admin check timed out. Please refresh the page. (Error: ${errorCode})`);
      }
    }
  );

  const dataFetch = useTimeout(
    async () => {
      logger.logApiCall('/admin/data', 'GET', { componentName: 'Admin' });
      const results = await Promise.all([
        fetchUsers(),
        fetchStats()
      ]);
      return results;
    },
    {
      timeout: 15000,
      componentName: 'Admin',
      operation: 'admin_data_fetch'
    }
  );

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        full_name,
        company_name,
        subscription_tier,
        generations_used,
        generations_limit,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    const formattedUsers: User[] = usersData?.map(user => ({
      id: user.user_id,
      email: user.email,
      created_at: user.created_at,
      profiles: {
        full_name: user.full_name,
        company_name: user.company_name,
        subscription_tier: user.subscription_tier,
        generations_used: user.generations_used,
        generations_limit: user.generations_limit
      }
    })) || [];

    setUsers(formattedUsers);
    return formattedUsers;
  };

  const fetchStats = async () => {
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.profiles && u.profiles.generations_used > 0).length,
      totalPosts: postsCount || 0,
      totalGenerations: users.reduce((sum, user) => sum + (user.profiles?.generations_used || 0), 0)
    };

    setStats(stats);
    return stats;
  };


  useEffect(() => {
    if (user) {
      adminCheck.execute();
    }
  }, [user]);

  useEffect(() => {
    if (user && isAdmin) {
      dataFetch.execute();
    }
  }, [user, isAdmin]);



  // Loading states and error handling
  if (adminCheck.loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Checking admin permissions...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (adminCheck.error || adminError) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-medium">Admin Check Failed</h3>
              <p className="text-muted-foreground">
                {adminCheck.error || adminError}
              </p>
              <Button onClick={adminCheck.retry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
              {adminCheck.errorCode && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error Code: {adminCheck.errorCode}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (dataFetch.loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading admin data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding>
      <ErrorBoundary componentName="Admin">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </header>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered accounts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Users with generations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      Generated content
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Generations</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalGenerations}</div>
                    <p className="text-xs text-muted-foreground">
                      AI generations used
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Tabs */}
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                  <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                  <TabsTrigger value="api-docs">API Documentation</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Manage user accounts, subscriptions, and permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {user.profiles?.full_name || 'N/A'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.profiles?.company_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {user.profiles?.subscription_tier || 'free'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {user.profiles?.generations_used || 0}/
                                  {user.profiles?.generations_limit || 10}
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Dashboard</CardTitle>
                      <CardDescription>
                        System usage and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                        <p className="text-muted-foreground">
                          Detailed analytics and reporting features will be available here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="webhooks" className="space-y-6">
                  <WebhookConfigurationContent />
                </TabsContent>

                <TabsContent value="api-keys" className="space-y-6">
                  <ApiKeysContent />
                </TabsContent>

                <TabsContent value="api-docs" className="space-y-6">
                  <ApiDocumentationContent />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </SidebarProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}