# V2 Frontend Auth & Family Onboarding Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Supabase anonymous sign-in, manage the global `family_id` context, and build the Welcome screen for creating/joining families.

**Architecture:** We will create an `AuthProvider` context to manage the Supabase session and user profile (`family_id`). We will modify `app/_layout.tsx` to conditionally route users to a new `app/welcome.tsx` screen if they are not yet part of a family.

**Tech Stack:** React Native, Expo Router, Supabase JS, React Context.

---

### Task 1: Create Auth Context

**Files:**
- Create: `contexts/AuthContext.tsx`

**Step 1: Write minimal implementation**

Create the context to hold the session, `userProfile` (which contains `family_id` and `role`), and the `inviteCode` (fetched from the families table).

```tsx
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
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: add AuthContext for Supabase anonymous sign-in and profile management"
```

---

### Task 2: Build the Welcome Screen (UI & RPC Calls)

**Files:**
- Create: `app/welcome.tsx`

**Step 1: Write minimal implementation**

Create a screen that calls the `create_new_family` and `join_family` RPCs we defined in the database.

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/colors';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

export default function WelcomeScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleCreateFamily = async () => {
    setIsCreating(true);
    const { error } = await supabase.rpc('create_new_family');
    setIsCreating(false);

    if (error) {
      Alert.alert('创建失败', error.message);
    } else {
      await refreshProfile();
      router.replace('/');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      Alert.alert('提示', '请输入6位有效邀请码');
      return;
    }
    
    setIsJoining(true);
    const { error } = await supabase.rpc('join_family', { invite_code_input: inviteCode.toUpperCase() });
    setIsJoining(false);

    if (error) {
      Alert.alert('加入失败', '邀请码无效或已过期');
    } else {
      await refreshProfile();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>欢迎来到 LessonLedger</Text>
        <Text style={styles.subtitle}>全家共享的课时账本</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>我是家长/发起人</Text>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleCreateFamily}
            disabled={isCreating || isJoining}
          >
            {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>创建新家庭账本</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>或</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>我是家庭成员</Text>
          <TextInput
            style={styles.input}
            placeholder="输入6位家庭邀请码"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleJoinFamily}
            disabled={isCreating || isJoining}
          >
            {isJoining ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.secondaryButtonText}>加入家庭</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 48 },
  card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, textAlign: 'center', letterSpacing: 2 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: COLORS.primary },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#EFF6FF' },
  secondaryButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 16, color: '#94A3B8', fontSize: 14 },
});
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add app/welcome.tsx
git commit -m "feat: add welcome screen for family onboarding"
```

---

### Task 3: Setup Navigation Guard

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Wrap App in AuthProvider and create AuthGuard**

Update `app/_layout.tsx` to wrap the `TabsWrapper` with `AuthProvider` and intercept the route if the user lacks a `family_id`.

```tsx
// At the top
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

// Create a guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (session && !profile?.family_id) {
    return <Redirect href="/welcome" />;
  }

  return <>{children}</>;
}

// Modify the default export to wrap the existing Tabs
export default function RootLayout() {
  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
             <AuthGuard>
               <TabsWrapper />
             </AuthGuard>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}
```

**Step 2: Add `welcome` to Tabs layout**

Ensure `welcome` is hidden from the bottom bar inside `TabsWrapper` in `app/_layout.tsx`.
```tsx
      <Tabs.Screen
        name="welcome"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }, // Hide tab bar on welcome screen
        }}
      />
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: implement AuthGuard routing to protect family-bound data"
```
