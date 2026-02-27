import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { formatDate, groupByDay } from "@/lib/utils";
import type { DetectedEvent } from "@shared/schema";

export default function CalendarPage() {
  const { data: events = [] } = useQuery<DetectedEvent[]>({ queryKey: ["/api/events"] });

  const confirmed = events
    .filter((e) => e.status === "confirmed")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const grouped = groupByDay(confirmed);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground text-sm">Confirmed events grouped by day</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No confirmed events yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Go to Inbox to analyze messages and create events.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            <h2 className="text-sm font-semibold text-brand-500 mb-3">{day}</h2>
            <div className="space-y-2">
              {dayEvents.map((event: any) => (
                <Card key={event.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{event.eventName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.startTime)} · {event.duration} min
                      </p>
                      {event.location && <p className="text-xs text-muted-foreground">📍 {event.location}</p>}
                    </div>
                    <Badge>{Math.round(event.confidenceScore * 100)}%</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
