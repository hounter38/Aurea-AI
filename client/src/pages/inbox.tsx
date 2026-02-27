import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

const SAMPLES = [
  { sender: "+1 (555) 123-4567", message: "Hi! Your dentist appointment is confirmed for March 15 at 2:30 PM. Reply C to confirm." },
  { sender: "Mom", message: "Hey, don't forget dinner at Grandma's on Sunday at 6pm. Also pick up your prescription from CVS — medication is ready." },
  { sender: "hr@company.com", message: "Reminder: sprint planning meeting tomorrow at 10am on Zoom. Project deadline is March 28th." },
];

export default function InboxPage() {
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [result, setResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const analyze = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ message, sender: sender || undefined }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setMessage("");
      setSender("");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const loadSample = (s: (typeof SAMPLES)[number]) => {
    setMessage(s.message);
    setSender(s.sender);
    setResult(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-muted-foreground text-sm">Paste a message for AI analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analyze Message</CardTitle>
          <CardDescription>Paste an SMS, call transcript, or email. Aurea will extract events automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {SAMPLES.map((s, i) => (
              <Button key={i} variant="outline" size="sm" onClick={() => loadSample(s)} className="text-xs">
                Sample {i + 1}
              </Button>
            ))}
          </div>

          <input
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Sender (optional)"
            className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste message content here…"
            rows={4}
            className="w-full rounded-lg bg-secondary border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />

          <Button onClick={() => analyze.mutate()} disabled={!message.trim() || analyze.isPending} className="w-full">
            {analyze.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Analyze with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-brand-500/30">
          <CardHeader>
            <CardTitle className="text-base text-brand-500">AI Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{result.response}</p>
            {result.events?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {result.events_found} event(s) extracted:
                </p>
                {result.events.map((ev: any) => (
                  <div key={ev.id} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ev.eventName}</span>
                      <Badge variant={ev.status === "confirmed" ? "default" : "secondary"}>
                        {ev.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(ev.startTime)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
