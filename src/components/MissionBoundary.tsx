import { t } from '../i18n/translate';
import { Component } from 'react';
import type { ReactNode } from 'react';

export default class MissionBoundary extends Component<{ children: ReactNode; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="mission-starting mission-unavailable" role="alert"><span className="eyebrow">{t("MISSION VIEW UNAVAILABLE")}</span><h1>{t("A different view is still possible.")}</h1><p>{t("The interactive map requires a working WebGL context. Try enabling graphics acceleration or another browser. No observations are displayed here.")}</p><button className="mission-button" onClick={this.props.onReturn}>{t("Return to Earth composition")}</button><button className="text-button" onClick={() => this.setState({ failed: false })}>{t("Retry mission view")}</button></section>;
  }
}
