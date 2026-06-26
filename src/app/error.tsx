"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-fluid-xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. You can try again or return home.
      </p>
      <Button onClick={reset} className="mt-8">
        <RefreshCw className="size-4" /> Try again
      </Button>
    </div>
  );
}
