import { useLocation, Link } from "wouter";
import { LayoutDashboard, Inbox, CalendarDays, Mic, Settings, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/events", label: "Events", icon: ListChecks },
  { href: "/voice", label: "Voice", icon: Mic },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/setup", label: "Setup", icon: Settings },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                  active ? "text-brand-500" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          <span className="text-brand-500">Aurea</span>
        </h1>
        <p className="text-xs text-muted-foreground">We remember so you don't have to</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-brand-500/10 text-brand-500 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
