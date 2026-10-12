import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kaelo caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      window.location.href = '/today';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-app, #FAF9F5)',
          color: 'var(--text-primary, #111111)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '380px',
            background: '#FFFFFF',
            padding: '32px 24px',
            borderRadius: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px'
            }}>
              ⚡
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              Execution Stream Paused
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '20px' }}>
              Kaelo encountered a momentary glitch. Tap below to reload your dashboard.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'var(--kaelo-lime, #C7FF35)',
                  color: '#111111',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                RELOAD DASHBOARD
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '14px',
                  background: 'transparent',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
