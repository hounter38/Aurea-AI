import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VoicePage() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const analyze = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ message: transcript, sender: "Voice Input" }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Input</h1>
        <p className="text-muted-foreground text-sm">Speak or type — Aurea will extract calendar events</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice / Text Input</CardTitle>
          <CardDescription>
            Type or dictate a message. Voice recording requires OpenAI API key for transcription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center py-6">
            <button
              className="h-24 w-24 rounded-full bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center hover:bg-brand-500/20 transition group"
              title="Voice recording coming soon"
            >
              <Mic className="h-10 w-10 text-brand-500 group-hover:scale-110 transition" />
            </button>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or paste transcribed text here…"
            rows={4}
            className="w-full rounded-lg bg-secondary border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />

          <Button onClick={() => analyze.mutate()} disabled={!transcript.trim() || analyze.isPending} className="w-full">
            {analyze.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Process with AI</>
            )}
          </Button>

          {result && (
            <div className="rounded-lg bg-brand-500/10 border border-brand-500/30 p-4 mt-4">
              <p className="text-sm">{result.response}</p>
              <p className="text-xs text-muted-foreground mt-2">{result.events_found} event(s) extracted</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
