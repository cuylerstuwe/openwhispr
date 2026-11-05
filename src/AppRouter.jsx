import { lazy, Suspense, useEffect, useState } from "react";
import App from "./App.jsx";
import AgentDictationPillOverlay from "./components/dictation/AgentDictationPillOverlay.tsx";
import MeetingNotificationOverlay from "./components/MeetingNotificationOverlay.tsx";
import { PermissionGuideOverlay } from "./components/onboarding/PermissionGuideOverlay";
import PersonalOnboarding from "./components/PersonalOnboarding";
import { useControlPanelWindowDrag } from "./hooks/useControlPanelWindowDrag";
import { useTheme } from "./hooks/useTheme";
import { isControlPanelWindow } from "./utils/windowContext.ts";
const ControlPanel = lazy(() => import("./components/ControlPanel.tsx"));
export default function AppRouter() {
  useTheme();
  const params = window.location.search;
  if (params.includes("permission-guide=true")) return <PermissionGuideOverlay />;
  if (params.includes("meeting-notification=true")) return <MeetingNotificationOverlay />;
  if (params.includes("agent-dictation-pill=true")) return <AgentDictationPillOverlay />;
  return <PersonalApp />;
}
function PersonalApp() {
  const panel = isControlPanelWindow();
  useControlPanelWindowDrag(panel);
  const [complete, setComplete] = useState(
    () => localStorage.getItem("onboardingCompleted") === "true"
  );
  const [settings, setSettings] = useState(undefined);
  useEffect(() => {
    if (!panel) return;
    void window.electronAPI?.setOnboardingWindowMode?.(complete ? "restore" : "expanded");
    void window.electronAPI?.setOnboardingActive?.(!complete);
  }, [panel, complete]);
  const finish = (configure) => {
    localStorage.setItem("onboardingCompleted", "true");
    localStorage.removeItem("onboardingSessionV2");
    localStorage.removeItem("onboardingCurrentStep");
    if (configure) setSettings("transcription");
    setComplete(true);
  };
  if (panel && !complete) return <PersonalOnboarding onComplete={finish} />;
  return panel ? (
    <Suspense fallback={<div className="p-8">Loading your workspace...</div>}>
      <ControlPanel initialSettingsSection={settings} />
    </Suspense>
  ) : (
    <App />
  );
}
