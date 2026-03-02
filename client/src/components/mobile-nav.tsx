import { Link, useLocation } from "wouter";
import { LayoutDashboard, MessageSquareText, CalendarCheck, Mic, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Analyze", url: "/inbox", icon: MessageSquareText },
  { title: "Events", url: "/events", icon: CalendarCheck },
  { title: "Voice", url: "/voice", icon: Mic },
  { title: "Setup", url: "/setup", icon: Settings },
];

export function MobileNav() {
  const [location] = useLocation();

  const { data: stats } = useQuery<{ pending: number }>({
    queryKey: ["/api/stats"],
    refetchInterval: 15000,
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-yellow-400/10 bg-black/95 backdrop-blur-sm safe-area-bottom" data-testid="nav-mobile">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.title} href={item.url}>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1.5 min-w-[3.5rem] transition-colors",
                  isActive
                    ? "text-yellow-400"
                    : "text-yellow-400/30"
                )}
                data-testid={`button-nav-${item.title.toLowerCase()}`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.title === "Events" && stats && stats.pending > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
                      {stats.pending > 9 ? "9+" : stats.pending}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-yellow-400" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
