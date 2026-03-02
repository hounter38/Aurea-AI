import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Trash2,
  User2,
  CalendarDays,
  Apple,
  Download,
  CheckCheck,
} from "lucide-react";
import { FibonacciSpiral } from "@/components/fibonacci-spiral";
import { format, formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetectedEvent {
  id: number;
  messageText: string;
  senderName: string | null;
  eventName: string;
  startTime: string;
  duration: number;
  location: string | null;
  notes: string | null;
  confidenceScore: number;
  status: string;
  calendarEventId: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge variant="outline" className="border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5">
        <Clock className="h-3 w-3 mr-1" /> Pending
      </Badge>
    );
  if (status === "confirmed")
    return (
      <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <XCircle className="h-3 w-3 mr-1" /> Dismissed
    </Badge>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-yellow-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function downloadIcs(eventId: number) {
  window.open(`/api/events/${eventId}/ics`, "_blank");
}

function EventRow({ event }: { event: DetectedEvent }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/events/${event.id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Synced to Google Calendar", description: event.eventName });
    },
    onError: () => toast({ title: "Sync failed", variant: "destructive" }),
  });

  const dismissMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/events/${event.id}/dismiss`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Event dismissed" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/events/${event.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Event deleted" });
    },
  });

  const isBusy = confirmMutation.isPending || dismissMutation.isPending || deleteMutation.isPending;

  return (
    <div
      data-testid={`card-event-${event.id}`}
      className="rounded-lg border border-card-border bg-card overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm" data-testid={`text-event-name-${event.id}`}>
                {event.eventName}
              </p>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
              "{event.messageText}"
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={isBusy}
              data-testid={`button-delete-${event.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
            {format(new Date(event.startTime), "MMM d, h:mm a")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {event.duration} min
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.senderName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User2 className="h-3.5 w-3.5 shrink-0" />
              {event.senderName}
            </div>
          )}
        </div>

        <ConfidenceBar score={event.confidenceScore} />
      </div>

      {event.status === "pending" && (
        <div className="border-t border-card-border bg-muted/30 px-4 py-3 flex gap-2">
          <Button
            className="flex-1 h-10 gap-2 text-sm font-medium"
            onClick={() => confirmMutation.mutate()}
            disabled={isBusy}
            data-testid={`button-confirm-${event.id}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirmMutation.isPending ? "Syncing..." : "Add to Google Calendar"}
          </Button>
          <Button
            variant="secondary"
            className="h-10 gap-2 text-sm"
            onClick={() => downloadIcs(event.id)}
            data-testid={`button-apple-${event.id}`}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Apple Calendar</span>
            <span className="sm:hidden">.ics</span>
          </Button>
          <Button
            variant="ghost"
            className="h-10 px-3 text-muted-foreground"
            onClick={() => dismissMutation.mutate()}
            disabled={isBusy}
            data-testid={`button-dismiss-${event.id}`}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {event.status === "confirmed" && (
        <div className="border-t border-card-border bg-muted/30 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Synced to Google Calendar
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => downloadIcs(event.id)}
            data-testid={`button-apple-confirmed-${event.id}`}
          >
            <Download className="h-3 w-3" />
            Also add to Apple Calendar
          </Button>
        </div>
      )}

      {event.status === "dismissed" && (
        <div className="border-t border-card-border bg-muted/30 px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" />
          Event dismissed
        </div>
      )}
    </div>
  );
}

export default function Events() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: events, isLoading } = useQuery<DetectedEvent[]>({
    queryKey: ["/api/events"],
    refetchInterval: 15000,
  });

  const confirmAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/events/confirm-all"),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: `${data.confirmed} event${data.confirmed !== 1 ? "s" : ""} confirmed`,
        description: "All pending events synced to Google Calendar.",
      });
    },
    onError: () => toast({ title: "Batch confirm failed", variant: "destructive" }),
  });

  const all = events || [];
  const pending = all.filter((e) => e.status === "pending");
  const confirmed = all.filter((e) => e.status === "confirmed");
  const dismissed = all.filter((e) => e.status === "dismissed");

  function EventList({ items }: { items: DetectedEvent[] }) {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-md" />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No events in this category</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 md:space-y-6 relative">
      <FibonacciSpiral className="absolute top-0 right-0 -translate-y-4 translate-x-8" size={180} opacity={0.04} />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-yellow-400">
            <CalendarCheck className="h-5 w-5 text-yellow-400" />
            Events Queue
          </h1>
          <p className="text-yellow-400/40 text-sm mt-1">
            Review, confirm, and manage all AI-detected events.
          </p>
        </div>
        {pending.length >= 2 && (
          <Button
            onClick={() => confirmAllMutation.mutate()}
            disabled={confirmAllMutation.isPending}
            className="gap-2 shrink-0"
            data-testid="button-confirm-all"
          >
            <CheckCheck className="h-4 w-4" />
            {confirmAllMutation.isPending
              ? "Syncing..."
              : `Confirm All (${pending.length})`}
          </Button>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1 gap-1.5" data-testid="tab-pending">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="h-4 text-xs px-1.5">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-1 gap-1.5" data-testid="tab-confirmed">
            Confirmed
            {confirmed.length > 0 && (
              <Badge variant="secondary" className="h-4 text-xs px-1.5">
                {confirmed.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="flex-1 gap-1.5" data-testid="tab-dismissed">
            Dismissed
            {dismissed.length > 0 && (
              <Badge variant="secondary" className="h-4 text-xs px-1.5">
                {dismissed.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <EventList items={pending} />
        </TabsContent>
        <TabsContent value="confirmed" className="mt-4">
          <EventList items={confirmed} />
        </TabsContent>
        <TabsContent value="dismissed" className="mt-4">
          <EventList items={dismissed} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <EventList items={all} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
