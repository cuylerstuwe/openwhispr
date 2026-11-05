import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Button } from "./ui/button";

export default function PersonalOnboarding({
  onComplete,
}: {
  onComplete: (configureModels: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const skip = () => {
    useSettingsStore.getState().updateCleanupSettings({ useCleanupModel: false });
    onComplete(false);
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-8 py-10 text-foreground">
      <section className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Whispr Personal
        </p>
        {step === 0 ? (
          <>
            <h1 className="text-2xl font-semibold">Dictation on your terms</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use models on this PC, your own server, or a provider you choose. Your history and
              Insights stay on this computer. No account is needed.
            </p>
            <Button onClick={() => setStep(1)}>Continue</Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Set up models now or later</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Speech recognition needs a transcription model or endpoint when you dictate. AI
              cleanup and the assistant are optional. You can configure everything later in
              Settings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onComplete(true)}>Configure models</Button>
              <Button variant="outline" onClick={skip}>
                Skip model setup
              </Button>
            </div>
            <button className="text-sm text-muted-foreground underline" onClick={() => setStep(0)}>
              Back
            </button>
          </>
        )}
      </section>
    </main>
  );
}
