import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Compass className="size-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">
        404
      </p>
      <h1 className="mt-2 text-fluid-2xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
