"use client";

import * as React from "react";
import { ErrorState } from "@/components/shared/states";

interface State {
  hasError: boolean;
  message?: string;
}

/** Class-based error boundary for portal sections. */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorState
            message={this.state.message ?? "An unexpected error occurred."}
            onRetry={this.reset}
          />
        )
      );
    }
    return this.props.children;
  }
}
