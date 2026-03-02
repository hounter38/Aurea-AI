import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MessageSquareText,
  CalendarCheck,
  Mic,
  CalendarDays,
  Sparkles,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { GoldenRing } from "@/components/fibonacci-spiral";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Analyze Message", url: "/inbox", icon: MessageSquareText },
  { title: "Events Queue", url: "/events", icon: CalendarCheck },
  { title: "Voice Assistant", url: "/voice", icon: Mic },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Automation Setup", url: "/setup", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  const { data: stats } = useQuery<{ pending: number }>({
    queryKey: ["/api/stats"],
    refetchInterval: 15000,
  });

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 relative overflow-hidden">
        <GoldenRing className="absolute -top-6 -right-6 opacity-40" size={100} />
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-400">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest text-yellow-400 uppercase">Aurea</p>
            <p className="text-[11px] text-yellow-400/50 italic leading-tight">We remember so you don't have to</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-yellow-400/40">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className="data-[active=true]:bg-yellow-400/10 data-[active=true]:text-yellow-400"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.title === "Events Queue" && stats && stats.pending > 0 && (
                          <Badge
                            variant="default"
                            className="ml-auto h-5 text-xs px-1.5"
                            data-testid="badge-pending-count"
                          >
                            {stats.pending}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 relative overflow-hidden">
        <GoldenRing className="absolute -bottom-8 -left-8 opacity-20" size={80} />
        <p className="text-xs text-yellow-400/40 relative z-10">
          Powered by{" "}
          <span className="font-medium text-yellow-400/70">Fibonacci Harmony</span>
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
