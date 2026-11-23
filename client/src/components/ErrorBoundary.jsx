import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, msg: err?.message || String(err) };
  }
  componentDidCatch(err, info) {
    console.error('[CL] React crash caught', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="screen">
          <div className="panel">
            <h2>ERRORE RECUPERATO</h2>
            <p>Si è verificato un problema nell'interfaccia, ma la partita non è stata chiusa.</p>
            <p className="muted">{this.state.msg}</p>
            <div className="panel-actions">
              <button className="primary" onClick={() => this.setState({ hasError: false, msg: '' })}>TORNA AL GIOCO</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
