import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";
import {
  Home,
  Wand2,
  User,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Mic,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Generate Posts", url: "/generate", icon: Wand2 },
  { title: "Brand Voice", url: "/brand-voice", icon: Mic },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const currentPath = location.pathname;
  const [chatOpen, setChatOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary";

  // Check admin status from both profile subscription_tier and admin_users table
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // First check profile subscription tier
      if (profile?.subscription_tier === 'admin') {
        setIsAdmin(true);
        return;
      }
      
      // Then check admin_users table
      try {
        const { data } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsAdmin(!!data);
        
        // If user is admin but profile doesn't reflect it, refresh profile
        if (data && profile?.subscription_tier !== 'admin') {
          await refreshProfile();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user, profile?.subscription_tier, refreshProfile]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-bold text-lg">SocialAI</h2>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="p-2 border-b border-border">
          <SidebarTrigger className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} py-2 hover:bg-secondary transition-colors`}>
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2">Collapse</span>
              </>
            )}
          </SidebarTrigger>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.subscription_tier || 'Free'} Plan
                </p>
              </div>
            </div>
            
            {profile && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Generations</span>
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
            )}
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Chat Widget */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setChatOpen(true)}>
                  <MessageSquare className="h-4 w-4" />
                  {!collapsed && <span>AI Copilot</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="justify-start w-full"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>

      {/* Chat Widget */}
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Sidebar>
  );
}