import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

const TYPE_COLORS = {
  appointment: "border-blue-500 bg-blue-500/10",
  medication: "border-emerald-500 bg-emerald-500/10",
  meeting: "border-violet-500 bg-violet-500/10",
  deadline: "border-red-500 bg-red-500/10",
  focus: "border-indigo-500 bg-indigo-500/10",
  reminder: "border-amber-500 bg-amber-500/10",
};

const SOURCE_ICONS = { sms: "\u{1F4F1}", call: "\u{1F4DE}", email: "\u{1F4E7}", manual: "\u{270D}\uFE0F" };

function EventCard({ event }) {
  return (
    <div className={`rounded-xl border p-4 ${TYPE_COLORS[event.type] || TYPE_COLORS.reminder}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{event.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">{SOURCE_ICONS[event.source] || "\u{1F4CB}"}</span>
          <span className="text-xs uppercase tracking-wider opacity-60">{event.type}</span>
        </div>
      </div>
      <p className="mt-1 text-sm opacity-70">
        {new Date(event.datetime).toLocaleString()}
        {event.duration_minutes && <span> &middot; {event.duration_minutes} min</span>}
      </p>
      {event.notes && <p className="mt-1 text-xs opacity-50">{event.notes}</p>}
      {event.calendar && (
        <p className="mt-2 text-xs">
          {event.calendar.provider === "google_calendar" ? (
            <a href={event.calendar.htmlLink} target="_blank" rel="noreferrer"
               className="text-blue-400 hover:underline">View in Google Calendar</a>
          ) : (
            <span className="text-yellow-400/70">Demo mode &middot; calendar simulated</span>
          )}
        </p>
      )}
    </div>
  );
}

function MessageCard({ msg }) {
  const statusColors = {
    received: "text-yellow-400", processing: "text-blue-400",
    processed: "text-emerald-400", error: "text-red-400",
  };
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{SOURCE_ICONS[msg.source] || "\u{1F4CB}"}</span>
          <span className="font-medium text-sm">{msg.sender}</span>
        </div>
        <span className={`text-xs font-medium ${statusColors[msg.status] || ""}`}>{msg.status}</span>
      </div>
      <p className="mt-1 text-sm opacity-80 line-clamp-2">{msg.body}</p>
      <p className="mt-1 text-xs opacity-40">{new Date(msg.created_at).toLocaleString()}</p>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [health, setHealth] = useState(null);
  const [msgBody, setMsgBody] = useState("");
  const [msgSource, setMsgSource] = useState("sms");
  const [msgSender, setMsgSender] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState("loading");

  const fetchData = useCallback(async () => {
    try {
      const [evRes, msgRes, hRes] = await Promise.all([
        fetch(`${API}/api/events`),
        fetch(`${API}/api/messages`),
        fetch(`${API}/api/health`),
      ]);
      const [evData, msgData, hData] = await Promise.all([
        evRes.json(), msgRes.json(), hRes.json(),
      ]);
      setEvents(evData.events);
      setMessages(msgData.messages);
      setHealth(hData);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!msgBody.trim()) return;
    setProcessing(true);
    setLastResult(null);
    try {
      const res = await fetch(`${API}/api/process-inline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: msgBody,
          source: msgSource,
          sender: msgSender || (msgSource === "sms" ? "+1555000000" : msgSource === "call" ? "Phone Call" : "email@example.com"),
        }),
      });
      const data = await res.json();
      setLastResult(data);
      setMsgBody("");
      setMsgSender("");
      await fetchData();
    } catch {
      setLastResult({ error: "Failed to process" });
    }
    setProcessing(false);
  };

  const SAMPLE_MESSAGES = [
    { source: "sms", sender: "+1 (555) 123-4567", body: "Hi! Your dentist appointment is confirmed for March 15 at 2:30 PM. Reply C to confirm." },
    { source: "call", sender: "Mom", body: "Hey sweetie, just calling to remind you to pick up your prescription from CVS pharmacy. They said your medication is ready. Also, don't forget we have dinner at Grandma's on Sunday at 6pm." },
    { source: "email", sender: "hr@company.com", body: "Subject: Sprint Planning\n\nHi team, reminder that our sprint planning meeting is tomorrow at 10am on Zoom. Please have your estimates ready. The project deadline is March 28th." },
  ];

  const loadSample = (sample) => {
    setMsgSource(sample.source);
    setMsgSender(sample.sender);
    setMsgBody(sample.body);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-indigo-400">Aurea</span> Dashboard
            </h1>
            <p className="text-sm opacity-60">Message &rarr; AI &rarr; Google Calendar</p>
          </div>
          {health && (
            <div className="flex gap-3 text-xs">
              <span className={`px-2 py-1 rounded ${health.mode === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                LLM: {health.mode}
              </span>
              <span className={`px-2 py-1 rounded ${health.google_calendar === "connected" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                Calendar: {health.google_calendar}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        {status === "error" && (
          <div className="rounded-lg bg-red-500/10 border border-red-500 p-3 text-red-300 text-sm">
            Cannot reach backend &mdash; make sure the API server is running on port 4000.
          </div>
        )}

        {/* Pipeline Input */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold mb-1">Simulate Incoming Message</h2>
          <p className="text-sm opacity-50 mb-4">Paste an SMS, call transcript, or email. Aurea will extract events and push them to Google Calendar.</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            {SAMPLE_MESSAGES.map((s, i) => (
              <button key={i} onClick={() => loadSample(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:border-indigo-500 hover:text-indigo-300 transition">
                {SOURCE_ICONS[s.source]} Sample {s.source.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <select value={msgSource} onChange={(e) => setMsgSource(e.target.value)}
                className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm">
                <option value="sms">SMS</option>
                <option value="call">Call Transcript</option>
                <option value="email">Email</option>
              </select>
              <input value={msgSender} onChange={(e) => setMsgSender(e.target.value)}
                placeholder="Sender (optional)"
                className="w-48 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Paste message content here…"
              rows={3}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <button type="submit" disabled={processing || !msgBody.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 font-medium hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed">
              {processing ? "Processing…" : "Process with AI \u2192 Calendar"}
            </button>
          </form>

          {lastResult && !lastResult.error && (
            <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="text-sm font-medium text-emerald-400">
                {lastResult.events_created} event(s) extracted &amp; sent to calendar
                <span className="ml-2 text-xs opacity-60">({lastResult.mode})</span>
              </p>
              <div className="mt-2 space-y-1">
                {lastResult.events.map((ev, i) => (
                  <p key={i} className="text-xs opacity-80">
                    &bull; {ev.title} &mdash; {new Date(ev.datetime).toLocaleString()} ({ev.type})
                  </p>
                ))}
              </div>
            </div>
          )}
          {lastResult && lastResult.error && (
            <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm">
              {lastResult.error}
            </div>
          )}
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Events */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Calendar Events ({events.length})</h2>
            {events.length === 0 ? (
              <p className="opacity-50 text-sm">No events yet. Process a message above to create calendar events.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
              </div>
            )}
          </section>

          {/* Message Feed */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Message Feed ({messages.length})</h2>
            {messages.length === 0 ? (
              <p className="opacity-50 text-sm">No messages received yet.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => <MessageCard key={m.id} msg={m} />)}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs opacity-40">
        Aurea &mdash; Messages &rarr; AI &rarr; Google Calendar &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
