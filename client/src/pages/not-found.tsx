import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <h1 className="text-4xl font-bold text-brand-500">404</h1>
      <p className="text-muted-foreground mt-2">Page not found</p>
      <Link href="/">
        <Button className="mt-4">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
