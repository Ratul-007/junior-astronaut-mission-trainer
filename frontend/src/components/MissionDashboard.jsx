import { useState } from 'react';
import {
  createMissionState,
  getResourceStatus,
  RESOURCE_META,
  resolveDecision,
} from '../game/missionEngine.js';
import './MissionDashboard.css';

const RESOURCE_ORDER = ['power', 'water', 'food', 'lifeSupport', 'radiation'];

function ResourceCard({ resourceKey, value }) {
  const meta = RESOURCE_META[resourceKey];
  const status = getResourceStatus(value, meta.criticalAt);
  return (
    <article className="resource-card">
      <div className="resource-heading">
        <span className="resource-label">{meta.label}</span>
        <strong className={`resource-value ${status}`}>{value}{meta.unit}</strong>
      </div>
      <div className="resource-track" role="progressbar" aria-label={meta.label} aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
        <div className={`resource-fill ${status}`} style={{ width: `${value}%` }} />
      </div>
      <span className="resource-status">{status === 'healthy' ? 'NOMINAL' : status === 'warning' ? 'MONITOR' : 'LOW RESERVE'}</span>
    </article>
  );
}

export default function MissionDashboard() {
  const [environment, setEnvironment] = useState('Moon');
  const [mission, setMission] = useState(() => createMissionState('Moon'));

  function startMission(nextEnvironment = environment) {
    setEnvironment(nextEnvironment);
    setMission(createMissionState(nextEnvironment));
  }

  function chooseResponse(choiceId) {
    setMission((current) => resolveDecision(current, choiceId));
  }

  const event = mission.currentEvent;

  return (
    <main className="mission-app">
      <header className="topbar">
        <a className="brand" href="#mission-home" aria-label="Junior Astronaut Mission Trainer home">
          <span className="brand-mark">✦</span>
          <span>JUNIOR ASTRONAUT <b>MISSION TRAINER</b></span>
        </a>
        <div className="topbar-right"><span className="live-dot" /> SIMULATION SYSTEM ONLINE</div>
      </header>

      <section className="mission-hero" id="mission-home">
        <div className="hero-copy">
          <p className="eyebrow">NASA SPACE APPS CHALLENGE 2026 · TRAINING SIMULATOR</p>
          <h1>Every decision<br /><span>shapes the mission.</span></h1>
          <p className="hero-description">Lead an outpost beyond Earth. Balance vital resources, respond to unexpected events, and keep your crew safe.</p>
          <div className="environment-picker" aria-label="Choose mission environment">
            <span>MISSION ENVIRONMENT</span>
            {['Moon', 'Mars'].map((place) => (
              <button key={place} className={environment === place ? 'environment-button selected' : 'environment-button'} onClick={() => startMission(place)} type="button">
                <span>{place === 'Moon' ? '◐' : '◉'}</span> {place}
              </button>
            ))}
          </div>
        </div>
        <div className="planet-scene" aria-label={`${environment} mission environment illustration`}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className={environment === 'Moon' ? 'planet moon' : 'planet mars'} />
          <div className="scene-label"><span className="live-dot" /> {environment.toUpperCase()} OUTPOST <small>HABITAT // 01</small></div>
          <div className="scene-coordinates">MISSION ZONE<br />{environment === 'Moon' ? '09° 42′ N / 18° 13′ E' : '04° 30′ S / 137° 26′ E'}</div>
        </div>
      </section>

      <section className="mission-stats" aria-label="Mission statistics">
        <div><span className="stat-label">MISSION DAY</span><strong>{String(mission.day).padStart(2, '0')} <small>/ 30</small></strong></div>
        <div><span className="stat-label">MISSION SCORE</span><strong>{mission.score.toString().padStart(3, '0')} <small>PTS</small></strong></div>
        <div><span className="stat-label">EVENTS RESOLVED</span><strong>{String(mission.eventHistory.length).padStart(2, '0')}</strong></div>
        <div><span className="stat-label">CREW STATUS</span><strong className={mission.status === 'active' ? 'status-active' : 'status-failed'}>{mission.status === 'active' ? 'STABLE' : 'AT RISK'}</strong></div>
      </section>

      <section className="resource-section">
        <div className="section-heading"><div><p className="eyebrow">SYSTEMS MONITOR</p><h2>Outpost resources</h2></div><span className="section-note">LIVE RESERVE LEVELS · 0–100%</span></div>
        <div className="resource-grid">
          {RESOURCE_ORDER.map((key) => <ResourceCard key={key} resourceKey={key} value={mission.resources[key]} />)}
        </div>
      </section>

      <section className="gameplay-grid">
        <div className="event-panel">
          <div className="panel-topline"><span className="eyebrow">MISSION EVENT // {String(mission.eventHistory.length + 1).padStart(2, '0')}</span><span className={event?.severity === 'critical' ? 'severity critical' : 'severity'}>{event?.severity === 'critical' ? '● CRITICAL' : '● SYSTEM ALERT'}</span></div>
          {mission.status === 'active' && event ? (
            <>
              <h2>{event.title}</h2>
              <p className="event-description">{event.description}</p>
              <p className="decision-prompt">Choose your response, commander.</p>
              <div className="choice-list">
                {event.choices.map((choice, index) => (
                  <button className="choice-card" type="button" key={choice.id} onClick={() => chooseResponse(choice.id)}>
                    <span className="choice-number">0{index + 1}</span>
                    <span className="choice-copy"><strong>{choice.label}</strong><small>{choice.detail}</small></span>
                    <span className="choice-arrow">↗</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mission-failed">
              <h2>Mission compromised</h2>
              <p>A critical resource has reached zero. Review your decisions and launch a new mission.</p>
              <button className="primary-button" onClick={() => startMission()} type="button">↻ Restart mission</button>
            </div>
          )}
          <div className="panel-footer"><span>DECISION IMPACTS RESOURCE LEVELS</span><span>SELECT ONE RESPONSE →</span></div>
        </div>

        <aside className="feedback-column">
          <div className="side-panel">
            <p className="eyebrow">COMMAND LOG</p><h3>Mission feedback</h3>
            {mission.lastFeedback ? (
              <>
                <span className="log-tag">DAY {mission.lastFeedback.eventTitle ? mission.day - 1 : mission.day} · RESPONSE RECORDED</span>
                <p className="feedback-message">{mission.lastFeedback.message}</p>
                <div className="science-note"><strong>SCIENCE BRIEF</strong><p>{mission.lastFeedback.scienceNote}</p></div>
              </>
            ) : <p className="empty-log">Your decisions and science notes will appear here after the first event.</p>}
          </div>
          <div className="side-panel alerts-panel">
            <p className="eyebrow">SYSTEM NOTIFICATIONS</p><h3>Resource alerts <span className="alert-count">{mission.alerts.length}</span></h3>
            {mission.alerts.length ? <ul>{mission.alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul> : <p className="empty-log">All monitored resources are above their alert thresholds.</p>}
          </div>
          <button className="reset-button" type="button" onClick={() => startMission()}>↻ Reset current mission</button>
        </aside>
      </section>

      <footer className="dashboard-footer"><span>JUNIOR ASTRONAUT MISSION TRAINER</span><span>EDUCATIONAL SIMULATION · NOT A REAL-TIME NASA OPERATIONS SYSTEM</span></footer>
    </main>
  );
}
