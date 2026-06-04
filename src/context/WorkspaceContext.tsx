import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandKit } from '../pages/CampaignStudioPage';

export interface ActiveDish {
  name: string;
  description: string;
  price: string;
  rawImageUrl: string | null;
  processedImageUrl: string | null;
}

export interface WorkspaceSession {
  userId: string;
  restaurantName: string;
  brandKit: BrandKit | null;
  activeDish: ActiveDish | null;
  auditResults: any | null;
  menuCardUrl: string | null;
  updatedAt: string;
}

interface WorkspaceContextProps {
  user: { name: string; email: string; avatar: string } | null;
  restaurantName: string;
  brandKit: BrandKit | null;
  activeDish: ActiveDish | null;
  auditResults: any | null;
  menuCardUrl: string | null;
  isSessionLoading: boolean;
  login: (name: string, email: string) => Promise<void>;
  logout: () => void;
  updateBrandKit: (kit: BrandKit) => Promise<void>;
  updateActiveDish: (dish: ActiveDish) => Promise<void>;
  updateAuditResults: (results: any) => Promise<void>;
  updateMenuCardUrl: (url: string) => Promise<void>;
  resetSession: () => Promise<void>;
  /** Update header name live while typing — no Firestore write */
  setRestaurantNameLive: (name: string) => void;
}


const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [activeDish, setActiveDish] = useState<ActiveDish | null>(null);
  const [auditResults, setAuditResults] = useState<any | null>(null);
  const [menuCardUrl, setMenuCardUrl] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Load user session from sessionStorage on init
  useEffect(() => {
    const storedUser = sessionStorage.getItem('10x_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      loadSessionFromCloud(parsed.email);
    }
  }, []);

  const loadSessionFromCloud = async (email: string) => {
    setIsSessionLoading(true);
    try {
      const res = await fetch(`http://localhost:3005/api/get-session?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          const s = data.session;
          if (s.restaurantName) setRestaurantName(s.restaurantName);
          if (s.brandKit) {
            setBrandKit(s.brandKit);
            sessionStorage.setItem('brandKit', JSON.stringify(s.brandKit));
          }
          if (s.activeDish) setActiveDish(s.activeDish);
          if (s.auditResults) setAuditResults(s.auditResults);
          if (s.menuCardUrl) setMenuCardUrl(s.menuCardUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load session from Firebase:', err);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const saveSessionToCloud = async (updatedData: Partial<WorkspaceSession>, currentEmail?: string) => {
    const targetEmail = currentEmail || user?.email;
    if (!targetEmail) return;

    try {
      await fetch('http://localhost:3005/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          session: updatedData
        })
      });
    } catch (err) {
      console.error('Failed to sync session to Firebase:', err);
    }
  };

  const login = async (name: string, email: string) => {
    setIsSessionLoading(true);
    const avatar = name.charAt(0).toUpperCase();
    const newUser = { name, email, avatar };
    setUser(newUser);
    sessionStorage.setItem('10x_user', JSON.stringify(newUser));
    await loadSessionFromCloud(email);
  };

  const logout = () => {
    setUser(null);
    setBrandKit(null);
    setActiveDish(null);
    setAuditResults(null);
    setMenuCardUrl(null);
    setRestaurantName('');

    sessionStorage.removeItem('10x_user');
    sessionStorage.removeItem('brandKit');
  };

  const updateBrandKit = async (kit: BrandKit) => {
    setBrandKit(kit);
    setRestaurantName(kit.restaurantName);
    sessionStorage.setItem('brandKit', JSON.stringify(kit));
    await saveSessionToCloud({ brandKit: kit, restaurantName: kit.restaurantName });
  };

  const updateActiveDish = async (dish: ActiveDish) => {
    setActiveDish(dish);
    await saveSessionToCloud({ activeDish: dish });
  };

  const updateAuditResults = async (results: any) => {
    setAuditResults(results);
    await saveSessionToCloud({ auditResults: results });
  };

  const updateMenuCardUrl = async (url: string) => {
    setMenuCardUrl(url);
    await saveSessionToCloud({ menuCardUrl: url });
  };

  const resetSession = async () => {
    setBrandKit(null);
    setActiveDish(null);
    setAuditResults(null);
    setMenuCardUrl(null);
    setRestaurantName('Spice Garden');
    sessionStorage.removeItem('brandKit');
    await saveSessionToCloud({
      brandKit: null,
      activeDish: null,
      auditResults: null,
      menuCardUrl: null,
      restaurantName: ''

    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        restaurantName,
        brandKit,
        activeDish,
        auditResults,
        menuCardUrl,
        isSessionLoading,
        login,
        logout,
        updateBrandKit,
        updateActiveDish,
        updateAuditResults,
        updateMenuCardUrl,
        resetSession,
        setRestaurantNameLive: setRestaurantName,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
