import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, RefreshCw } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

function getEventDate(event: CalendarEvent): Date | null {
  const raw = event.start?.dateTime || event.start?.date;
  if (!raw) return null;
  return new Date(raw);
}

function formatEventTime(event: CalendarEvent): string {
  const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
  const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  if (!start) return "All day";
  if (end) return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  return format(start, "h:mm a");
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return format(date, "EEEE");
  return format(date, "EEEE, MMMM d");
}

function groupEventsByDay(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const date = getEventDate(event);
    if (!date) continue;
    const key = format(date, "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return groups;
}

export default function Calendar() {
  const { data: events, isLoading, refetch, isFetching } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/upcoming"],
    refetchInterval: 60000,
  });

  const grouped = events ? groupEventsByDay(events) : {};
  const days = Object.keys(grouped).sort();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upcoming events from your Google Calendar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
          data-testid="button-refresh-calendar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : days.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your Google Calendar is clear for now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {days.map((day) => {
            const dayDate = new Date(day + "T00:00:00");
            const label = getDayLabel(dayDate);
            const isCurrentDay = isToday(dayDate);
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${isCurrentDay ? "text-primary" : "text-foreground"}`}
                    data-testid={`text-day-${day}`}
                  >
                    {label}
                  </p>
                  {isCurrentDay && (
                    <Badge variant="default" className="h-4 text-xs px-1.5">
                      Today
                    </Badge>
                  )}
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {format(dayDate, "MMM d")}
                  </span>
                </div>

                <div className="space-y-2">
                  {grouped[day].map((event) => {
                    const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
                    const timeStr = formatEventTime(event);
                    return (
                      <div
                        key={event.id}
                        data-testid={`card-cal-event-${event.id}`}
                        className="flex gap-3 rounded-md border border-card-border bg-card p-4"
                      >
                        {start && (
                          <div className="shrink-0 flex flex-col items-center justify-center h-12 w-12 rounded-md bg-primary/10">
                            <p className="text-xs font-semibold text-primary leading-none">
                              {format(start, "h:mm")}
                            </p>
                            <p className="text-xs text-primary/70">{format(start, "a")}</p>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {event.summary || "Untitled Event"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeStr}
                            </span>
                            {event.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
