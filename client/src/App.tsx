import { Route, Switch } from "wouter";
import { Sidebar, MobileNav } from "./components/mobile-nav";
import Dashboard from "./pages/dashboard";
import InboxPage from "./pages/inbox";
import EventsPage from "./pages/events";
import VoicePage from "./pages/voice";
import CalendarPage from "./pages/calendar";
import SetupPage from "./pages/setup";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/voice" component={VoicePage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/setup" component={SetupPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}
