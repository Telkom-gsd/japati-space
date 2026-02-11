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

  const fetchProfile = useCallback(async (userId: string, forceRefresh = false): Promise<Profile | null> => {
    try {
      // Build query with optional cache busting
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);

      // Add timestamp to bust cache if force refresh
      if (forceRefresh) {
        query = query.order("updated_at", { ascending: false });
      }

      const { data, error } = await query.single();

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

      console.log("Profile fetched:", { role: data?.role, email: data?.email });
      return data as Profile;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log("Refreshing profile for user:", user.id);
      const profileData = await fetchProfile(user.id, true); // Force refresh
      setProfile(profileData);
      console.log("Profile refreshed:", { role: profileData?.role });
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
        ]) as { data: { session: any } };
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch profile - retry if failed
          try {
            console.log("Fetching initial profile for:", initialSession.user.id);
            const profileData = await fetchProfile(initialSession.user.id);
            
            if (mounted && profileData) {
              console.log("Initial profile set:", { role: profileData.role, email: profileData.email });
              setProfile(profileData);
            } else if (mounted) {
              console.warn("Initial profile fetch returned null");
              // Try one more time after a delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              const retryProfile = await fetchProfile(initialSession.user.id);
              if (mounted && retryProfile) {
                console.log("Retry profile set:", { role: retryProfile.role });
                setProfile(retryProfile);
              }
            }
          } catch (profileError) {
            console.error("Error fetching initial profile:", profileError);
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
        
        // Only update session and user if they actually changed
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Skip fetching profile on TOKEN_REFRESHED events if we already have one
          // This prevents unnecessary re-fetches that could cause race conditions
          if (event === 'TOKEN_REFRESHED') {
            console.log("Token refreshed, keeping existing profile");
            setLoading(false);
            return;
          }

          // For SIGNED_IN event, check if we already have the correct profile
          // This handles repeated SIGNED_IN events from Supabase
          if (event === 'SIGNED_IN') {
            // Get current profile state - use a ref-like approach
            setProfile(currentProfile => {
              // If we already have a profile for this user, don't fetch again
              if (currentProfile && currentProfile.id === currentSession.user.id) {
                console.log("Already have profile for this user, skipping fetch");
                return currentProfile;
              }
              return currentProfile; // Will trigger fetch below
            });
          }

          try {
            // Only fetch if we don't have a profile or it's for a different user
            const shouldFetch = await new Promise<boolean>((resolve) => {
              setProfile(currentProfile => {
                const needsFetch = !currentProfile || currentProfile.id !== currentSession.user.id;
                resolve(needsFetch);
                return currentProfile;
              });
            });

            if (shouldFetch) {
              console.log("Fetching profile for user:", currentSession.user.id);
              const profileData = await fetchProfile(currentSession.user.id);
              
              if (mounted && profileData) {
                console.log("Setting profile:", { role: profileData.role, email: profileData.email });
                setProfile(profileData);
              } else if (mounted && !profileData) {
                console.warn("Profile fetch returned null, keeping existing profile");
                // DON'T set profile to null - keep the existing one
              }
            }
          } catch (error) {
            console.error("Error fetching profile on auth change:", error);
            // DON'T set profile to null on error - keep the existing one
          }
        } else {
          // Only clear profile when user is actually logged out
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
