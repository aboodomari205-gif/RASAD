import { t } from '../i18n/translate';
import { Component } from 'react';
import type { ReactNode } from 'react';
/** Keep scientific views recoverable for oversized scopes or failed lazy chunks. */
export default class AnalysisBoundary extends Component<{ children: ReactNode; onReset: () => void; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="mission-starting mission-unavailable" role="alert"><span className="eyebrow">{t("ANALYSIS VIEW UNAVAILABLE")}</span><h1>{t("This scope could not be rendered.")}</h1><p>{t("The observation window may exceed the interactive aggregation limit, or a view resource failed. No analysis or verified zero is inferred.")}</p><button className="mission-button" onClick={() => { this.props.onReset(); this.setState({ failed: false }); }}>{t("Reset analysis filters")}</button><button className="text-button" onClick={this.props.onReturn}>{t("Return to Mission Atlas")}</button></section>;
  }
}
