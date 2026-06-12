import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  family_id: string;
  role: 'creator' | 'member';
};

type AuthContextType = {
  session: Session | null;
  profile: UserProfile | null;
  inviteCode: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  inviteCode: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile:', error);
      }
      
      setProfile(data || null);

      if (data?.family_id) {
        const { data: familyData } = await supabase
          .from('families')
          .select('invite_code')
          .eq('id', data.family_id)
          .single();
        if (familyData) setInviteCode(familyData.invite_code);
      }
    } catch (e) {
      console.warn('Profile fetch failed', e);
    }
  };

  useEffect(() => {
    // Attempt anonymous sign in on boot if no session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (!currentSession) {
        supabase.auth.signInAnonymously().then(({ data }) => {
          setSession(data.session);
          if (data.session) fetchProfile(data.session.user.id);
        });
      } else {
        fetchProfile(currentSession.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    setIsLoading(false);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      profile, 
      inviteCode, 
      isLoading, 
      refreshProfile: () => session ? fetchProfile(session.user.id) : Promise.resolve() 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);