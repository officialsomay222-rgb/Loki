import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ChatProvider } from "./contexts/ChatContext";
import { GlobalInteractionProvider } from "./contexts/GlobalInteractionContext";
import { AuthProvider } from "./contexts/AuthContext";
import { registerSW } from "virtual:pwa-register";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { applyDevicePerformanceClass } from "./utils/performance";
import "./lib/firebase";

import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

// Apply performance class early in the lifecycle
applyDevicePerformanceClass();

// Enable VirtualKeyboard API for smooth keyboard transitions in modern browsers
if ("virtualKeyboard" in navigator) {
  (navigator as any).virtualKeyboard.overlaysContent = true;
}

// Set up smooth keyboard handling for Capacitor native apps
if (Capacitor.isNativePlatform()) {
  try {
    Keyboard.setResizeMode({ mode: KeyboardResize.None });
    Keyboard.setScroll({ isDisabled: true });

    // Listen to keyboard events and update CSS variable for smooth padding transition
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty(
        "--keyboard-inset-bottom",
        `${info.keyboardHeight}px`,
      );
      document.documentElement.classList.add("keyboard-is-open");
    });

    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty(
        "--keyboard-inset-bottom",
        "0px",
      );
      document.documentElement.classList.remove("keyboard-is-open");
    });
  } catch (err) {
    console.warn("Capacitor Keyboard plugin error:", err);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

try {
  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
    },
    onOfflineReady() {},
  });
} catch (e) {
  console.warn(
    "PWA service worker registration failed (expected in some iframe environments):",
    e,
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <GlobalInteractionProvider>
              <ChatProvider>
                <App />
                <Toaster theme="dark" position="top-center" />
              </ChatProvider>
            </GlobalInteractionProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
