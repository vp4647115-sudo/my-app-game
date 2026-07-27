import React from 'react';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-[#e3e3de]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-[#FAF9F6] mb-2">
            Session Encountered a State Reset
          </h2>
          <p className="font-body text-xs text-[#c4c7c7] max-w-md mb-6 leading-relaxed">
            An unexpected error occurred in this view. Don't worry—your profile and game data remain completely safe.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Return to Main Dashboard</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
