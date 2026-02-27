import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Smartphone, Webhook, Calendar } from "lucide-react";

export default function SetupPage() {
  const { data: health } = useQuery<{
    status: string;
    mode: string;
    calendar: string;
    database: string;
  }>({ queryKey: ["/api/health"] });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setup</h1>
        <p className="text-muted-foreground text-sm">Configure automation and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">AI Engine</span>
            <Badge variant={health?.mode === "live" ? "default" : "secondary"}>
              {health?.mode === "live" ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Live (OpenAI)</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Demo Mode</>
              )}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Google Calendar</span>
            <Badge variant={health?.calendar === "connected" ? "default" : "secondary"}>
              {health?.calendar === "connected" ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Demo Mode</>
              )}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <Badge variant={health?.database === "postgres" ? "default" : "secondary"}>
              {health?.database === "postgres" ? "PostgreSQL" : "In-Memory"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-brand-500" />
            <CardTitle className="text-base">Android SMS Automation (Tasker)</CardTitle>
          </div>
          <CardDescription>Set up automatic SMS forwarding from your Android phone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Install <strong>Tasker</strong> from the Google Play Store (~$3.50)</li>
            <li>Create a new <strong>Profile</strong> → Event → Phone → Received Text</li>
            <li>Set the <strong>Task</strong> to: Net → HTTP Request</li>
            <li>Configure the HTTP request:
              <div className="bg-secondary rounded-lg p-3 mt-2 font-mono text-xs">
                <p>Method: POST</p>
                <p>URL: http://YOUR_SERVER:5000/api/sms/ingest</p>
                <p>Content-Type: application/json</p>
                <p>Body: {`{"message": "%SMSRB", "sender": "%SMSRF"}`}</p>
              </div>
            </li>
            <li>Every incoming SMS will be automatically analyzed and added to your calendar</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-brand-500" />
            <CardTitle className="text-base">API Endpoint</CardTitle>
          </div>
          <CardDescription>Send messages programmatically from any source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary rounded-lg p-3 font-mono text-xs">
            <p className="text-brand-500">POST /api/sms/ingest</p>
            <p className="mt-2 text-muted-foreground">{`{`}</p>
            <p className="text-muted-foreground">{`  "message": "Your dentist apt is March 15 at 2:30pm",`}</p>
            <p className="text-muted-foreground">{`  "sender": "+1555123456"`}</p>
            <p className="text-muted-foreground">{`}`}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-500" />
            <CardTitle className="text-base">Google Calendar Setup</CardTitle>
          </div>
          <CardDescription>Connect your Google Calendar for automatic event creation</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Create a Google Cloud project with Calendar API enabled</p>
          <p>2. Set up OAuth 2.0 credentials</p>
          <p>3. Set <code className="bg-secondary px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="bg-secondary px-1 rounded">GOOGLE_CLIENT_SECRET</code> in .env</p>
          <p>4. Visit <code className="bg-secondary px-1 rounded">/api/auth/google</code> to authorize</p>
        </CardContent>
      </Card>
    </div>
  );
}
