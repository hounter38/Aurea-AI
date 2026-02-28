import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  CalendarDays,
  MessageSquarePlus,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetectedEvent {
  id: number;
  messageText: string;
  senderName: string | null;
  eventName: string;
  startTime: string;
  duration: number;
  location: string | null;
  confidenceScore: number;
  status: string;
  calendarEventId: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  dismissed: number;
  todayCalendar: number;
}

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-yellow-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function EventCard({ event }: { event: DetectedEvent }) {
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/events/${event.id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Event confirmed", description: `"${event.eventName}" added to Google Calendar.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to sync to Google Calendar.", variant: "destructive" }),
  });

  const dismissMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/events/${event.id}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Event dismissed" });
    },
  });

  return (
    <div
      data-testid={`card-event-${event.id}`}
      className="flex flex-col gap-3 rounded-md border border-card-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{event.eventName}</p>
          {event.senderName && (
            <p className="text-xs text-muted-foreground mt-0.5">from {event.senderName}</p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {format(new Date(event.startTime), "MMM d, h:mm a")}
        </Badge>
      </div>
      {event.location && (
        <p className="text-xs text-muted-foreground truncate">{event.location}</p>
      )}
      <ConfidenceBar score={event.confidenceScore} />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-9"
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending || dismissMutation.isPending}
          data-testid={`button-confirm-${event.id}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          {confirmMutation.isPending ? "Syncing..." : "Google Calendar"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 gap-1.5"
          onClick={() => window.open(`/api/events/${event.id}/ics`, "_blank")}
          data-testid={`button-apple-${event.id}`}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Apple</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-2 text-muted-foreground"
          onClick={() => dismissMutation.mutate()}
          disabled={confirmMutation.isPending || dismissMutation.isPending}
          data-testid={`button-dismiss-${event.id}`}
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 15000,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<DetectedEvent[]>({
    queryKey: ["/api/events"],
  });

  const { data: calendarEvents, isLoading: calendarLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/upcoming"],
  });

  const pendingEvents = events?.filter((e) => e.status === "pending").slice(0, 3) || [];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1 italic">
          We remember so you don't have to
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-4 sm:grid-cols-4">
        {(["pending", "confirmed", "dismissed", "todayCalendar"] as const).map((key) => {
          const labels: Record<string, { label: string; icon: any; color: string }> = {
            pending: { label: "Pending", icon: Clock, color: "text-yellow-500" },
            confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-green-500" },
            dismissed: { label: "Dismissed", icon: XCircle, color: "text-muted-foreground" },
            todayCalendar: { label: "Today on Calendar", icon: CalendarDays, color: "text-primary" },
          };
          const { label, icon: Icon, color } = labels[key];
          return (
            <Card key={key} data-testid={`card-stat-${key}`}>
              <CardContent className="pt-4 pb-3 md:pt-5 md:pb-4 px-3 md:px-5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">{label}</p>
                  <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${color}`} />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-10 md:h-8 md:w-12" />
                ) : (
                  <p className="text-2xl md:text-3xl font-bold">{stats?.[key] ?? 0}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Events */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Pending Confirmation
            </h2>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-md" />
              ))}
            </div>
          ) : pendingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CalendarCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending events.</p>
                <Link href="/inbox">
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Analyze a message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {(stats?.pending ?? 0) > 3 && (
                <Link href="/events">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    View {(stats?.pending ?? 0) - 3} more <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Calendar Events */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Events
            </h2>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          {calendarLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : !calendarEvents || calendarEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming events found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {calendarEvents.slice(0, 5).map((event) => {
                const start = event.start?.dateTime
                  ? new Date(event.start.dateTime)
                  : event.start?.date
                  ? new Date(event.start.date)
                  : null;
                return (
                  <div
                    key={event.id}
                    data-testid={`card-calendar-${event.id}`}
                    className="flex items-center gap-3 rounded-md border border-card-border bg-card px-4 py-3"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.summary || "Untitled"}</p>
                      {start && (
                        <p className="text-xs text-muted-foreground">
                          {format(start, "EEE, MMM d · h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
