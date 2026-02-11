"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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
  
  // Use ref to track if we already have a valid profile
  const profileRef = useRef<Profile | null>(null);
  const isFetchingProfile = useRef(false);

  const supabase = createClient();

  // Simple profile fetch without complex timeout/race logic
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Prevent concurrent fetches
    if (isFetchingProfile.current) {
      console.log("Already fetching profile, skipping...");
      return profileRef.current;
    }
    
    isFetchingProfile.current = true;
    
    try {
      console.log("Fetching profile for:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn("Profile not found, waiting for trigger...");
          // Wait for database trigger to create profile
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: retryData, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          
          if (!retryError && retryData) {
            console.log("Profile found on retry:", { role: retryData.role, email: retryData.email });
            profileRef.current = retryData as Profile;
            return retryData as Profile;
          }
        }
        console.error("Error fetching profile:", error.message);
        return null;
      }

      console.log("Profile fetched successfully:", { role: data?.role, email: data?.email });
      profileRef.current = data as Profile;
      return data as Profile;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    } finally {
      isFetchingProfile.current = false;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log("Force refreshing profile for:", user.id);
      isFetchingProfile.current = false; // Allow fetch
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        profileRef.current = profileData;
      }
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session - no timeout, just wait for it
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError.message);
          if (mounted) setLoading(false);
          return;
        }
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          console.log("Initial session found for:", initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch profile
          const profileData = await fetchProfile(initialSession.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
            console.log("Initial auth complete. Role:", profileData.role);
          }
        } else {
          console.log("No initial session");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        if (!mounted) return;

        // Handle different events
        switch (event) {
          case 'SIGNED_OUT':
            setSession(null);
            setUser(null);
            setProfile(null);
            profileRef.current = null;
            setLoading(false);
            break;
            
          case 'SIGNED_IN':
          case 'INITIAL_SESSION':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              
              // Only fetch profile if we don't have one or it's for a different user
              if (!profileRef.current || profileRef.current.id !== currentSession.user.id) {
                const profileData = await fetchProfile(currentSession.user.id);
                if (mounted && profileData) {
                  setProfile(profileData);
                }
              } else {
                console.log("Using cached profile:", { role: profileRef.current.role });
                setProfile(profileRef.current);
              }
            }
            setLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            // Keep existing profile, just update session
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
              // Don't refetch profile on token refresh
              console.log("Token refreshed, keeping profile:", { role: profileRef.current?.role });
            }
            setLoading(false);
            break;
            
          case 'USER_UPDATED':
            if (currentSession?.user) {
              setSession(currentSession);
              setUser(currentSession.user);
              // Refresh profile on user update
              const profileData = await fetchProfile(currentSession.user.id);
              if (mounted && profileData) {
                setProfile(profileData);
              }
            }
            setLoading(false);
            break;
            
          default:
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
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      return { error: null };
    } catch (err) {
      setLoading(false);
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
    console.log("Signing out...");
    try {
      // Clear state first for immediate UI feedback
      setUser(null);
      setProfile(null);
      setSession(null);
      profileRef.current = null;
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      console.log("Signed out successfully");
    } catch (err) {
      console.error("Error during signOut:", err);
      // State is already cleared, so user is effectively logged out
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
