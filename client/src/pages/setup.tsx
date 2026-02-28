import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Smartphone, Zap, ArrowRight, ExternalLink, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const appUrl = window.location.origin;
  const endpointUrl = `${appUrl}/api/sms/ingest`;

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-setup-title">Automation Setup</h1>
        <p className="text-muted-foreground mt-1">Connect your phone's text messages to Aurea for automatic calendar event detection.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-start">
            <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
            <p className="text-sm">You receive a text message on your phone</p>
          </div>
          <div className="flex gap-3 items-center text-muted-foreground">
            <ArrowRight className="h-4 w-4 shrink-0 ml-2" />
            <p className="text-xs italic">Tasker automatically sends it to Aurea</p>
          </div>
          <div className="flex gap-3 items-start">
            <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
            <p className="text-sm">Aurea's AI analyzes the message for scheduling intent</p>
          </div>
          <div className="flex gap-3 items-center text-muted-foreground">
            <ArrowRight className="h-4 w-4 shrink-0 ml-2" />
            <p className="text-xs italic">High confidence events are auto-confirmed</p>
          </div>
          <div className="flex gap-3 items-start">
            <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
            <p className="text-sm">Events appear on your Google Calendar automatically</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Your API Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint URL</label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all" data-testid="text-endpoint-url">
                {endpointUrl}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(endpointUrl, "url")}
                data-testid="button-copy-url"
              >
                {copiedField === "url" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</label>
            <div className="mt-1.5">
              <Badge variant="default" className="text-xs">POST</Badge>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">JSON Body Format</label>
            <div className="mt-1.5 relative">
              <pre className="bg-muted px-3 py-2 rounded-md text-sm font-mono whitespace-pre overflow-x-auto" data-testid="text-json-format">{`{
  "message": "SMS text content",
  "sender": "Contact name or number"
}`}</pre>
              <Button
                size="icon"
                variant="outline"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(`{\n  "message": "%SMSRB",\n  "sender": "%SMSRF"\n}`, "json")}
                data-testid="button-copy-json"
              >
                {copiedField === "json" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tasker Setup (Recommended)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tasker is an Android automation app (~$3.50 on Google Play). It runs in the background and can forward every incoming text to Aurea automatically.
          </p>

          <div className="space-y-4">
            <div className="border rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline">Step 1</Badge>
                Install Tasker
              </h3>
              <p className="text-sm text-muted-foreground">Download Tasker from the Google Play Store and grant it the permissions it asks for (SMS access, notifications).</p>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href="https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm" target="_blank" rel="noopener noreferrer" data-testid="link-tasker-play-store">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Play Store
                </a>
              </Button>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline">Step 2</Badge>
                Create a Profile
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Open Tasker and tap the <strong>+</strong> button to create a new Profile</li>
                <li>Choose <strong>Event</strong> then <strong>Phone</strong> then <strong>Received Text</strong></li>
                <li>Set Type to <strong>Any</strong> and leave other fields empty</li>
                <li>Tap the back arrow to proceed to the Task</li>
              </ul>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline">Step 3</Badge>
                Create the Task
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Name the task <strong>Aurea SMS</strong></li>
                <li>Tap <strong>+</strong> to add an action</li>
                <li>Choose <strong>Net</strong> then <strong>HTTP Request</strong></li>
                <li>Set Method to <strong>POST</strong></li>
                <li>Set URL to your endpoint (copy it above)</li>
                <li>Set Headers to: <code className="bg-muted px-1 rounded text-xs">Content-Type: application/json</code></li>
                <li>Set Body to:</li>
              </ul>
              <div className="relative">
                <pre className="bg-muted px-3 py-2 rounded-md text-xs font-mono whitespace-pre">{`{
  "message": "%SMSRB",
  "sender": "%SMSRF"
}`}</pre>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute top-1.5 right-1.5 h-6 w-6"
                  onClick={() => copyToClipboard(`{\n  "message": "%SMSRB",\n  "sender": "%SMSRF"\n}`, "tasker")}
                  data-testid="button-copy-tasker"
                >
                  {copiedField === "tasker" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">%SMSRB = message body, %SMSRF = sender name/number (Tasker built-in variables)</p>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline">Step 4</Badge>
                Activate
              </h3>
              <p className="text-sm text-muted-foreground">Tap the toggle at the top of Tasker to activate the profile. Every incoming text message will now be automatically sent to Aurea for analysis.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Other Automation Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border rounded-lg p-3">
            <h3 className="font-semibold text-sm">MacroDroid (Free alternative)</h3>
            <p className="text-sm text-muted-foreground mt-1">Free on Play Store. Create a macro: Trigger = SMS Received, Action = HTTP Request (POST) to the endpoint above with the same JSON body.</p>
          </div>
          <div className="border rounded-lg p-3">
            <h3 className="font-semibold text-sm">Automate (Free alternative)</h3>
            <p className="text-sm text-muted-foreground mt-1">Free on Play Store. Create a flow: SMS Received block connected to an HTTP Request block pointing to the endpoint above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
