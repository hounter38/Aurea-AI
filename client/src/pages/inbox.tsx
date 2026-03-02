import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquareText,
  Sparkles,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  MapPin,
  Clock,
  User2,
  AlertCircle,
  Download,
} from "lucide-react";
import { FibonacciSpiral } from "@/components/fibonacci-spiral";
import { format } from "date-fns";
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
  confidenceScore: number;
  status: string;
}

interface AnalyzeResult {
  detected: boolean;
  message?: string;
  event?: DetectedEvent;
  autoConfirmed?: boolean;
}

function ConfidencePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const variant = pct >= 80 ? "default" : "secondary";
  return (
    <Badge variant={variant} data-testid="badge-confidence">
      {pct}% confidence
    </Badge>
  );
}

const exampleMessages = [
  `Hey! Can we grab coffee tomorrow at 10am? Maybe at Blue Bottle Coffee near the office?`,
  `Let's schedule a team standup for Friday at 2pm. 30 minutes should be enough.`,
  `The client meeting is confirmed for next Monday at 3:30 PM at their downtown office.`,
];

export default function Inbox() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const data = await apiRequest("POST", "/api/analyze", { messageText, senderName: senderName || undefined });
      return data as AnalyzeResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.detected) {
        qc.invalidateQueries({ queryKey: ["/api/events"] });
        qc.invalidateQueries({ queryKey: ["/api/stats"] });
        qc.invalidateQueries({ queryKey: ["/api/calendar/upcoming"] });
        if (data.autoConfirmed) {
          toast({ title: "Auto-synced to Google Calendar", description: `High confidence event "${data.event?.eventName}" was automatically added.` });
        }
      }
    },
    onError: () => {
      toast({ title: "Analysis failed", description: "Could not analyze the message.", variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/events/${id}/confirm`),
    onSuccess: () => {
      toast({ title: "Event synced!", description: "Added to your Google Calendar." });
      setResult((prev) =>
        prev?.event ? { ...prev, event: { ...prev.event, status: "confirmed" } } : prev
      );
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => toast({ title: "Sync failed", description: "Could not add to Google Calendar.", variant: "destructive" }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/events/${id}/dismiss`),
    onSuccess: () => {
      toast({ title: "Event dismissed" });
      setResult((prev) =>
        prev?.event ? { ...prev, event: { ...prev.event, status: "dismissed" } } : prev
      );
      qc.invalidateQueries({ queryKey: ["/api/events"] });
      qc.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleAnalyze = () => {
    if (!messageText.trim()) return;
    setResult(null);
    analyzeMutation.mutate();
  };

  const fillExample = (msg: string) => {
    setMessageText(msg);
    setResult(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 md:space-y-6 relative">
      <FibonacciSpiral className="absolute top-0 right-0 -translate-y-4 translate-x-8" size={180} opacity={0.04} />
      <div className="relative z-10">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-yellow-400">
          <MessageSquareText className="h-5 w-5 text-yellow-400" />
          Analyze Message
        </h1>
        <p className="text-yellow-400/40 text-sm mt-1">
          Paste any message and Aurea will detect scheduling intent automatically.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Message Input</CardTitle>
          <CardDescription>Enter the message you want to analyze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sender">Sender name (optional)</Label>
            <Input
              id="sender"
              placeholder="e.g. John from Acme Corp"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              data-testid="input-sender"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder={`Paste a message here, e.g. "Let's grab coffee tomorrow at 10am at Starbucks"`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
              className="resize-none"
              data-testid="textarea-message"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!messageText.trim() || analyzeMutation.isPending}
            className="w-full gap-2"
            data-testid="button-analyze"
          >
            <Sparkles className="h-4 w-4" />
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try an example</p>
        <div className="flex flex-col gap-2">
          {exampleMessages.map((msg, i) => (
            <button
              key={i}
              onClick={() => fillExample(msg)}
              className="text-left text-sm text-muted-foreground rounded-md border border-card-border bg-card px-4 py-2.5 hover-elevate transition-colors truncate"
              data-testid={`button-example-${i}`}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div data-testid="div-result">
          {!result.detected ? (
            <div className="flex items-center gap-3 rounded-md border border-card-border bg-card px-4 py-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">No scheduling intent detected</p>
                <p className="text-xs text-muted-foreground">This message doesn't appear to contain meeting or event details.</p>
              </div>
            </div>
          ) : result.event ? (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-primary" />
                    {result.autoConfirmed ? "Auto-Synced to Calendar" : "Event Detected"}
                  </CardTitle>
                  <ConfidencePill score={result.event.confidenceScore} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-lg font-semibold" data-testid="text-event-name">{result.event.eventName}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span data-testid="text-event-time">
                      {format(new Date(result.event.startTime), "EEEE, MMMM d · h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{result.event.duration} minutes</span>
                  </div>
                  {result.event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{result.event.location}</span>
                    </div>
                  )}
                  {result.event.senderName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{result.event.senderName}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {result.event.status === "pending" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 h-11 gap-2 text-sm font-medium"
                        onClick={() => confirmMutation.mutate(result.event!.id)}
                        disabled={confirmMutation.isPending || dismissMutation.isPending}
                        data-testid="button-result-confirm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {confirmMutation.isPending ? "Syncing..." : "Add to Google Calendar"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-11 gap-2 text-sm"
                        onClick={() => window.open(`/api/events/${result.event!.id}/ics`, "_blank")}
                        data-testid="button-result-apple"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Apple Calendar</span>
                        <span className="sm:hidden">.ics</span>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full h-8 gap-2 text-muted-foreground text-xs"
                      onClick={() => dismissMutation.mutate(result.event!.id)}
                      disabled={confirmMutation.isPending || dismissMutation.isPending}
                      data-testid="button-result-dismiss"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {result.event.status === "confirmed" && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Synced to Google Calendar</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                      onClick={() => window.open(`/api/events/${result.event!.id}/ics`, "_blank")}
                      data-testid="button-result-apple-confirmed"
                    >
                      <Download className="h-3 w-3" />
                      Also add to Apple Calendar
                    </Button>
                  </div>
                )}

                {result.event.status === "dismissed" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span>Event dismissed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
