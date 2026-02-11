"use client";

import { useState, useEffect, type ReactElement } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Theme = "light" | "dark" | "system";

interface Settings {
  theme: Theme;
  showTooltips: boolean;
  defaultZoom: number;
  animationsEnabled: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultSettings: Settings = {
  theme: "light",
  showTooltips: true,
  defaultZoom: 100,
  animationsEnabled: true,
};

// Icons
const Icons = {
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Monitor: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Palette: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut, loading: authLoading, profile } = useAuth();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("japatispace-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        console.error("Failed to parse saved settings");
      }
    }
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.toggle("dark", settings.theme === "dark");
    }
  }, [settings.theme]);

  const handleSaveSettings = () => {
    localStorage.setItem("japatispace-settings", JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("japatispace-settings");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    console.log("Logout initiated...");
    
    try {
      // Close modal first
      onClose();
      
      // Call signOut
      await signOut();
      console.log("SignOut completed, redirecting...");
      
      // Force redirect to login with full page reload
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if error, still try to redirect
      window.location.replace("/login");
    }
  };

  if (!isOpen) return null;

  const ThemeButton = ({ theme, label, icon: Icon }: { 
    theme: Theme; 
    label: string; 
    icon: () => ReactElement;
  }) => (
    <button
      onClick={() => setSettings({ ...settings, theme })}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all flex-1 ${
        settings.theme === theme
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      {settings.theme === theme && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
          <Icons.Check />
        </div>
      )}
      <div className={`p-2 rounded-lg ${
        settings.theme === theme 
          ? "bg-blue-100 text-blue-600" 
          : "bg-gray-100 text-gray-600"
      }`}>
        <Icon />
      </div>
      <span className={`text-sm font-medium ${settings.theme === theme ? "text-blue-700" : "text-gray-700"}`}>
        {label}
      </span>
    </button>
  );

  const ToggleSwitch = ({ enabled, onChange, label }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
              <Icons.Settings />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pengaturan</h2>
              <p className="text-xs text-gray-500">Konfigurasi tampilan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Palette />
              <h3 className="text-sm font-semibold text-gray-700">Tema Tampilan</h3>
            </div>
            <div className="flex gap-3">
              <ThemeButton theme="light" label="Light" icon={Icons.Sun} />
              <ThemeButton theme="dark" label="Dark" icon={Icons.Moon} />
              <ThemeButton theme="system" label="System" icon={Icons.Monitor} />
            </div>
          </div>

          {/* Display Options */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icons.Eye />
              <h3 className="text-sm font-semibold text-gray-700">Opsi Tampilan</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 divide-y divide-gray-200">
              <ToggleSwitch
                enabled={settings.showTooltips}
                onChange={(value) => setSettings({ ...settings, showTooltips: value })}
                label="Tampilkan Tooltip"
              />
              <ToggleSwitch
                enabled={settings.animationsEnabled}
                onChange={(value) => setSettings({ ...settings, animationsEnabled: value })}
                label="Aktifkan Animasi"
              />
            </div>
          </div>

          {/* Default Zoom */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Zoom Default</span>
              <span className="text-sm font-semibold text-blue-600">{settings.defaultZoom}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={settings.defaultZoom}
              onChange={(e) => setSettings({ ...settings, defaultZoom: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Account Section - Only show if user is logged in */}
          {user && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icons.Logout />
                <h3 className="text-sm font-semibold text-gray-700">Akun</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900 truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Role</span>
                  <span className={`font-medium ${profile?.role === 'admin' ? 'text-blue-600' : 'text-gray-600'}`}>
                    {authLoading ? 'Loading...' : (profile?.role || 'user')}
                  </span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Icons.Logout />
                    {isLoggingOut ? 'Keluar...' : 'Keluar dari Akun'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* App Info */}
          <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
            <p>Japati Space v1.0.0</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleResetSettings}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isSaved
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSaved ? (
              <>
                <Icons.Check />
                Tersimpan!
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
