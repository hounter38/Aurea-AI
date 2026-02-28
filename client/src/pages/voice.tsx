import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Sparkles, Volume2, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceQueryResult {
  transcript: string;
  response: string;
}

const suggestions = [
  "What's my afternoon look like?",
  "Do I have any meetings today?",
  "Am I free at 3pm?",
  "What's my next event?",
];

export default function Voice() {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const queryMutation = useMutation({
    mutationFn: async (audio: string) => {
      const data = await apiRequest("POST", "/api/voice/query", { audio });
      return data as VoiceQueryResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      toast({
        title: "Query failed",
        description: "Could not process your voice query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          queryMutation.mutate(base64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
      setResult(null);
    } catch (err) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice queries.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const isProcessing = queryMutation.isPending;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Voice Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask Aurea about your schedule using your voice.
        </p>
      </div>

      {/* Main mic interface */}
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-6">
          {/* Animated mic button */}
          <div className="relative">
            {recording && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping scale-125 delay-75" />
              </>
            )}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={isProcessing}
              data-testid="button-mic"
              className={cn(
                "relative z-10 h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200",
                recording
                  ? "bg-destructive text-destructive-foreground"
                  : isProcessing
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : recording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          </div>

          <div className="text-center">
            {recording ? (
              <p className="text-sm font-medium text-destructive animate-pulse">
                Recording... tap to stop
              </p>
            ) : isProcessing ? (
              <p className="text-sm font-medium text-muted-foreground">
                Processing your query...
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap the microphone and ask about your schedule
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-3" data-testid="div-voice-result">
          <div className="rounded-md border border-card-border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">You said</p>
            <p className="text-sm" data-testid="text-transcript">"{result.transcript}"</p>
          </div>

          <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-primary uppercase tracking-wider">Aurea</p>
            </div>
            <p className="text-sm leading-relaxed" data-testid="text-ai-response">{result.response}</p>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Try asking
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-card-border bg-card px-3 py-2.5"
              data-testid={`div-suggestion-${i}`}
            >
              <Volume2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md border border-card-border bg-card px-4 py-3">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Aurea uses AI speech recognition and accesses your live Google Calendar to provide
          accurate schedule summaries.
        </p>
      </div>
    </div>
  );
}
