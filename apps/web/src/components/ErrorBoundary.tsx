import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <div className="error-screen__inner" role="alert">
            <span className="error-screen__glyph" aria-hidden="true">⚠</span>
            <h1 className="error-screen__title">Dashboard encountered an error</h1>
            <p className="error-screen__text">
              Something went wrong while rendering the map or data panels.
              Try reloading the page.
            </p>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload page
            </button>
            {this.state.error && (
              <pre className="error-screen__detail">{this.state.error.message}</pre>
            )}
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
