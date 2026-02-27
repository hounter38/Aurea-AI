import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

function EventCard({ event }) {
  const typeColors = {
    focus: "border-indigo-500 bg-indigo-500/10",
    medication: "border-emerald-500 bg-emerald-500/10",
    general: "border-amber-500 bg-amber-500/10",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${typeColors[event.type] || typeColors.general}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <span className="text-xs uppercase tracking-wider opacity-60">
          {event.type}
        </span>
      </div>
      <p className="mt-1 text-sm opacity-70">
        {new Date(event.start).toLocaleString()}
      </p>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("general");
  const [status, setStatus] = useState("loading");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/events`);
      const data = await res.json();
      setEvents(data.events);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });
      const data = await res.json();
      setEvents((prev) => [...prev, data.event]);
      setTitle("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-indigo-400">Aurea</span> Dashboard
        </h1>
        <p className="text-sm opacity-60">Anticipatory AI Assistant</p>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        {status === "error" && (
          <div className="rounded-lg bg-red-500/10 border border-red-500 p-3 text-red-300 text-sm">
            Cannot reach backend — make sure the API server is running on port
            4000.
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4">Add Event</h2>
          <form onSubmit={addEvent} className="flex gap-3">
            <input
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Event title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="general">General</option>
              <option value="focus">Focus</option>
              <option value="medication">Medication</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 font-medium hover:bg-indigo-500 transition"
            >
              Add
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
          {status === "loading" ? (
            <p className="opacity-50">Loading…</p>
          ) : events.length === 0 ? (
            <p className="opacity-50">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs opacity-40">
        Aurea &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
