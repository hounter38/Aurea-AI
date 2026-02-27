import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DetectedEvent } from "@shared/schema";

export default function Dashboard() {
  const { data: stats } = useQuery<{ total: number; pending: number; confirmed: number; dismissed: number }>({
    queryKey: ["/api/stats"],
  });

  const { data: events } = useQuery<DetectedEvent[]>({ queryKey: ["/api/events"] });

  const pending = events?.filter((e) => e.status === "pending").slice(0, 5) || [];
  const recent = events?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your AI calendar autopilot</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10">
              <CalendarDays className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.confirmed || 0}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.dismissed || 0}</p>
              <p className="text-xs text-muted-foreground">Dismissed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending events. Send a message to get started!</p>
            ) : (
              pending.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{event.eventName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.startTime)}</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                    {Math.round(event.confidenceScore * 100)}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              recent.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{event.eventName}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.senderName && `From ${event.senderName} · `}
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={event.status === "confirmed" ? "default" : event.status === "dismissed" ? "destructive" : "secondary"}
                  >
                    {event.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
