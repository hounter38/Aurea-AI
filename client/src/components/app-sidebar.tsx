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
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest text-foreground uppercase">Aurea</p>
            <p className="text-[11px] text-muted-foreground italic leading-tight">We remember so you don't have to</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
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

      <SidebarFooter className="px-4 py-4">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <span className="font-medium text-primary">Fibonacci Harmony</span>
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
