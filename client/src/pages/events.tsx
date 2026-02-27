import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, X, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import type { DetectedEvent } from "@shared/schema";

function EventCard({ event, onConfirm, onDismiss }: { event: DetectedEvent; onConfirm: () => void; onDismiss: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{event.eventName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(event.startTime)} · {event.duration} min</p>
            {event.senderName && <p className="text-xs text-muted-foreground mt-0.5">From: {event.senderName}</p>}
            {event.location && <p className="text-xs text-muted-foreground">📍 {event.location}</p>}
            {event.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.notes}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={event.status === "confirmed" ? "default" : event.status === "dismissed" ? "destructive" : "secondary"}
            >
              {event.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{Math.round(event.confidenceScore * 100)}% conf</span>
          </div>
        </div>

        {event.status === "pending" && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onConfirm} className="flex-1">
              <CheckCircle className="mr-1 h-3 w-3" /> Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss} className="flex-1">
              <X className="mr-1 h-3 w-3" /> Dismiss
            </Button>
          </div>
        )}

        {event.status === "confirmed" && (
          <div className="mt-3">
            <a href={`/api/events/${event.id}/ics`} download>
              <Button size="sm" variant="outline" className="w-full">
                <Download className="mr-1 h-3 w-3" /> Export .ics
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery<DetectedEvent[]>({ queryKey: ["/api/events"] });

  const confirm = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/events/${id}/confirm`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const dismiss = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/events/${id}/dismiss`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const pending = events.filter((e) => e.status === "pending");
  const confirmed = events.filter((e) => e.status === "confirmed");
  const dismissed = events.filter((e) => e.status === "dismissed");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground text-sm">Review, confirm, or dismiss extracted events</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({dismissed.length})</TabsTrigger>
        </TabsList>

        {(["pending", "confirmed", "dismissed"] as const).map((status) => {
          const list = status === "pending" ? pending : status === "confirmed" ? confirmed : dismissed;
          return (
            <TabsContent key={status} value={status} className="space-y-3">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No {status} events.</p>
              ) : (
                list.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onConfirm={() => confirm.mutate(event.id)}
                    onDismiss={() => dismiss.mutate(event.id)}
                  />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
