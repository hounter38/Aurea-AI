import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { InstallPrompt } from "@/components/install-prompt";
import Dashboard from "@/pages/dashboard";
import Inbox from "@/pages/inbox";
import Events from "@/pages/events";
import Voice from "@/pages/voice";
import Calendar from "@/pages/calendar";
import Setup from "@/pages/setup";
import { Sparkles } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/events" component={Events} />
      <Route path="/voice" component={Voice} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/setup" component={Setup} />
      <Route component={NotFound} />
    </Switch>
  );
}

const style = {
  "--sidebar-width": "17rem",
  "--sidebar-width-icon": "3.5rem",
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: `max(0.625rem, env(safe-area-inset-top, 0px))` }}>
                <SidebarTrigger data-testid="button-sidebar-toggle" className="hidden md:flex" />
                <div className="flex items-center gap-2 md:hidden">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-bold tracking-widest uppercase">Aurea</span>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground italic hidden sm:inline">We remember so you don't have to</span>
              </header>
              <main className="flex-1 overflow-auto pb-16 md:pb-0">
                <Router />
              </main>
            </div>
          </div>
          <MobileNav />
          <InstallPrompt />
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
