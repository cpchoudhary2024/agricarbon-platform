import { Component } from 'react';

/**
 * Section-level error boundary.
 *
 * This site depends on federal web services (SSURGO, CropScape, the Census geocoder) that are
 * free, essential, and occasionally down. Without a boundary, one failing section takes the whole
 * page with it — a farmer who came to read the contract matrix would get a blank screen because
 * the soil survey was having a bad afternoon.
 *
 * So each major section is wrapped independently. If one falls over, the rest of the page stands,
 * and the broken section says what went wrong instead of vanishing.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No analytics service here on purpose — this tool collects nothing about its users.
    // The console is where a developer will look, and it is the only place this needs to go.
    console.error(`[${this.props.name ?? 'section'}] render failed:`, error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="section">
        <div className="wrap">
          <div className="callout callout--warn">
            <strong>This section didn&rsquo;t load.</strong>{' '}
            {this.props.name ? `The ${this.props.name} failed to render. ` : ''}
            The rest of the page still works, and nothing you entered has been sent anywhere.
            {this.props.hint && <> {this.props.hint}</>}
            <div className="tiny muted mono" style={{ marginTop: 10 }}>
              {String(this.state.error?.message ?? this.state.error)}
            </div>
            <button
              className="btn btn--ghost"
              style={{ marginTop: 12, fontSize: 13, padding: '7px 13px' }}
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }
}
