import React from 'react';

/**
 * Catches a render error in the page below it and shows a plain error card
 * instead of unmounting the whole app into a blank black screen. The sidebar
 * stays mounted, so the user can navigate away or reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('SentinAI page error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-slate-100">Something went wrong on this page</h2>
          <p className="text-xs text-slate-400 mt-2">
            The rest of the app is fine — only this page failed to render.
          </p>
          <p className="text-xs font-mono text-crit mt-3 break-words">
            {String(this.state.error.message || this.state.error)}
          </p>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary" onClick={() => window.location.reload()}>Reload app</button>
            {this.props.onReset && (
              <button className="btn-ghost" onClick={this.props.onReset}>Back to Overview</button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
