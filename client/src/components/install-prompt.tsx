import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("aurea-install-dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setDeferredPrompt(null);
      localStorage.removeItem("aurea-install-dismissed");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("aurea-install-dismissed", "1");
  };

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 rounded-lg border border-primary/30 bg-card shadow-lg p-4 flex items-center gap-3"
      data-testid="div-install-prompt"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Install Aurea</p>
        <p className="text-xs text-muted-foreground mt-0.5">We remember so you don't have to</p>
      </div>
      <Button size="sm" className="gap-1.5 shrink-0" onClick={handleInstall} data-testid="button-install">
        <Download className="h-3.5 w-3.5" />
        Install
      </Button>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground p-1"
        data-testid="button-install-dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
