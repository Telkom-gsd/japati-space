"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";
import { Profile, UserRole } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, it might not have been created yet
        if (error.code === 'PGRST116') {
          console.warn("Profile not found, retrying once...");
          // Wait briefly and try again (trigger might be creating it)
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: retryData, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          
          if (!retryError && retryData) {
            console.log("Profile found on retry");
            return retryData as Profile;
          }
          
          console.error("Profile still not found after retry");
        } else {
          console.error("Error fetching profile:", error.message);
        }
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session: initialSession } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch profile with timeout protection
          try {
            const profileData = await Promise.race([
              fetchProfile(initialSession.user.id),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
            ]);
            
            if (mounted) {
              setProfile(profileData);
            }
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            if (mounted) {
              setProfile(null);
            }
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          try {
            const profileData = await Promise.race([
              fetchProfile(currentSession.user.id),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
            ]);
            
            if (mounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error("Error fetching profile on auth change:", error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } catch (err) {
      console.error("Error during signOut:", err);
    } finally {
      // Always clear state regardless of API response
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to check if user has required role
export function useRequireRole(requiredRole: UserRole) {
  const { profile, loading } = useAuth();

  if (loading) {
    return { hasAccess: false, loading: true };
  }

  if (!profile) {
    return { hasAccess: false, loading: false };
  }

  // Admin has access to everything
  if (profile.role === "admin") {
    return { hasAccess: true, loading: false };
  }

  // Check specific role
  return { hasAccess: profile.role === requiredRole, loading: false };
}
