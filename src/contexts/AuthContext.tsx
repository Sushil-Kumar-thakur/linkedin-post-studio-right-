import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useTimeout } from "@/hooks/useTimeout";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  linkedin_company_url: string | null;
  linkedin_personal_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  generations_used: number;
  generations_limit: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      logger.debug("No user found, skipping profile refresh", {
        componentName: "AuthContext",
      });
      return;
    }

    logger.debug("Refreshing user profile", {
      componentName: "AuthContext",
      userId: user.id,
      action: "refresh_profile",
    });

    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const duration = Date.now() - startTime;
      logger.logPerformance("profile_fetch", duration, {
        componentName: "AuthContext",
      });

      if (error) {
        logger.error("Error fetching profile", {
          componentName: "AuthContext",
          userId: user.id,
          data: { error: error.message },
        });
        return;
      }

      setProfile(data);
      logger.debug("Profile refreshed successfully", {
        componentName: "AuthContext",
        userId: user.id,
        data: { hasProfile: !!data },
      });
    } catch (error: any) {
      logger.error("Unexpected error in refreshProfile", {
        componentName: "AuthContext",
        userId: user.id,
        data: { error: error.message },
        stackTrace: error.stack,
      });
    }
  };

  useEffect(() => {
    logger.info("Initializing AuthContext", { componentName: "AuthContext" });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug(`Auth state changed: ${event}`, {
        componentName: "AuthContext",
        data: { event, hasSession: !!session, userId: session?.user?.id },
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        logger.logUserAction("user_authenticated", {
          componentName: "AuthContext",
          userId: session.user.id,
        });

        // Defer profile fetch with setTimeout to avoid auth state deadlock
        setTimeout(() => {
          refreshProfile();
        }, 0);
      } else {
        logger.info("User signed out, clearing profile", {
          componentName: "AuthContext",
        });
        setProfile(null);
      }

      setLoading(false);
    });

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        logger.debug("Checking existing session", {
          componentName: "AuthContext",
        });
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error("Error getting session", {
            componentName: "AuthContext",
            data: { error: error.message },
          });
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          logger.debug("Found existing session", {
            componentName: "AuthContext",
            userId: session.user.id,
          });
          setTimeout(() => {
            refreshProfile();
          }, 0);
        }

        setLoading(false);
      } catch (error: any) {
        logger.error("Unexpected error checking session", {
          componentName: "AuthContext",
          data: { error: error.message },
          stackTrace: error.stack,
        });
        setLoading(false);
      }
    };

    // Add timeout for session check
    const timeout = setTimeout(() => {
      logger.warn("Session check timeout", { componentName: "AuthContext" });
      setLoading(false);
    }, 10000);

    checkSession().finally(() => clearTimeout(timeout));

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    logger.logUserAction("signup_attempt", {
      componentName: "AuthContext",
      data: { email, fullName },
    });

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        logger.warn("Sign up failed", {
          componentName: "AuthContext",
          data: { error: error.message, email },
        });
        toast.error(error.message);
      } else {
        logger.info("Sign up successful", {
          componentName: "AuthContext",
          data: { email },
        });
        toast.success("Check your email to confirm your account!");
      }

      return { error };
    } catch (error: any) {
      logger.error("Unexpected error during sign up", {
        componentName: "AuthContext",
        data: { error: error.message, email },
        stackTrace: error.stack,
      });
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    logger.logUserAction("signin_attempt", {
      componentName: "AuthContext",
      data: { email },
    });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.warn("Sign in failed", {
          componentName: "AuthContext",
          data: { error: error.message, email },
        });
        toast.error(error.message);
      } else {
        logger.info("Sign in successful", {
          componentName: "AuthContext",
          data: { email },
        });
        toast.success("Welcome back!");
      }

      return { error };
    } catch (error: any) {
      logger.error("Unexpected error during sign in", {
        componentName: "AuthContext",
        data: { error: error.message, email },
        stackTrace: error.stack,
      });
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const signOut = async () => {
    logger.logUserAction("signout_attempt", {
      componentName: "AuthContext",
      userId: user?.id,
    });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.warn("Sign out failed", {
          componentName: "AuthContext",
          userId: user?.id,
          data: { error: error.message },
        });
        toast.error(error.message);
      } else {
        logger.info("Sign out successful", {
          componentName: "AuthContext",
          userId: user?.id,
        });
        toast.success("Signed out successfully");
      }

      return { error };
    } catch (error: any) {
      logger.error("Unexpected error during sign out", {
        componentName: "AuthContext",
        userId: user?.id,
        data: { error: error.message },
        stackTrace: error.stack,
      });
      toast.error("An unexpected error occurred");
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "reset-password",
        {
          body: { email },
        }
      );

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
