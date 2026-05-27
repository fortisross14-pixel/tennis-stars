import React, { useState, useMemo } from 'react';
import { GameState, Tournament, YearSummary } from './sim/types';
import { initGameState, advanceWeek, isOffseasonWeek } from './sim/engine';
import { buildCalendarForYear, tournamentsStartingInWeek, tournamentsInWeek } from './sim/calendar';
import { runOffseason } from './sim/offseason';
import { CalendarView } from './ui/CalendarView';
import { RankingView } from './ui/RankingView';
import { HistoryView } from './ui/HistoryView';
import { TournamentRunner } from './ui/TournamentRunner';
import { OffseasonView } from './ui/OffseasonView';
import { Flag } from './ui/common';

type Tab = 'current' | 'ranking' | 'calendar' | 'history';

export default function App() {
  const [state, setState] = useState<GameState>(() => initGameState());
  const [tab, setTab] = useState<Tab>('current');
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [offseasonSummary, setOffseasonSummary] = useState<YearSummary | null>(null);

  const inWeek = useMemo(
    () => tournamentsInWeek(state.calendar, state.currentWeek),
    [state.calendar, state.currentWeek],
  );
  const featuredThisWeek = useMemo(() => {
    const starting = tournamentsStartingInWeek(state.calendar, state.currentWeek);
    if (starting.length === 0) return null;
    const tierOrder: Record<string, number> = { GS: 5, WTF: 4, M1000: 3, T500: 2, T250: 1 };
    return [...starting]
      .filter(t => !t.winnerId)
      .sort((a, b) => tierOrder[b.tier] - tierOrder[a.tier])[0] ?? null;
  }, [state.calendar, state.currentWeek]);

  const handleAdvance = () => {
    if (isOffseasonWeek(state.currentWeek + 1)) {
      const summary = runOffseason(state);
      setState({
        ...state,
        currentWeek: 52,
        absoluteWeek: state.absoluteWeek + (52 - state.currentWeek),
        pastYearSummaries: [...state.pastYearSummaries, summary],
      });
      setOffseasonSummary(summary);
      return;
    }
    const { state: next } = advanceWeek(state);
    setState(next);
  };

  const handleEnterTournament = () => {
    if (!featuredThisWeek) return;
    setActiveTournament(featuredThisWeek);
  };

  const handleStartNewYear = () => {
    const newYear = state.year + 1;
    const newCal = buildCalendarForYear(newYear);
    setState({
      ...state,
      year: newYear,
      currentWeek: 1,
      absoluteWeek: (newYear - 1) * 52 + 1,
      calendar: newCal,
    });
    setOffseasonSummary(null);
  };

  // Offseason
  if (offseasonSummary) {
    return (
      <>
        <Masthead state={state} />
        <main>
          <OffseasonView state={state} summary={offseasonSummary} onDone={handleStartNewYear} />
        </main>
      </>
    );
  }

  // Active tournament
  if (activeTournament) {
    return (
      <>
        <Masthead state={state} />
        <main>
          <TournamentRunner
            state={state}
            setState={s => setState(s)}
            tournament={activeTournament}
            onClose={() => {
              setActiveTournament(null);
              const tourEndWeek = activeTournament.weekOfYear + activeTournament.durationWeeks - 1;
              const newAbs = (state.year - 1) * 52 + tourEndWeek;
              setState(prev => ({
                ...prev,
                currentWeek: tourEndWeek,
                absoluteWeek: newAbs,
              }));
            }}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Masthead state={state} />
      <div className="nav-wrap">
        <nav className="nav">
          <button
            className={`nav-tab ${tab === 'current' ? 'active' : ''}`}
            onClick={() => setTab('current')}
          >
            This Week
          </button>
          <button
            className={`nav-tab ${tab === 'ranking' ? 'active' : ''}`}
            onClick={() => setTab('ranking')}
          >
            Rankings
          </button>
          <button
            className={`nav-tab ${tab === 'calendar' ? 'active' : ''}`}
            onClick={() => setTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={`nav-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            History
          </button>
        </nav>
      </div>
      <main>
        {tab === 'current' && (
          <CurrentWeekView
            state={state}
            featured={featuredThisWeek}
            inWeek={inWeek}
            onAdvance={handleAdvance}
            onEnterTournament={handleEnterTournament}
          />
        )}
        {tab === 'ranking' && <RankingView state={state} setState={setState} />}
        {tab === 'calendar' && <CalendarView state={state} />}
        {tab === 'history' && <HistoryView state={state} />}
      </main>
    </>
  );
}

function Masthead({ state }: { state: GameState }) {
  const active = state.players.filter(p => !p.retired).length;
  return (
    <header className="masthead">
      <h1 className="mast-title">
        <span className="mast-title-mark">TS</span>
        Tennis Stars
      </h1>
      <div className="mast-meta">
        <strong>Year {state.year} · Week {state.currentWeek}</strong>
        {active} active · {state.history.length} tournaments contested
      </div>
    </header>
  );
}

function CurrentWeekView({
  state,
  featured,
  inWeek,
  onAdvance,
  onEnterTournament,
}: {
  state: GameState;
  featured: Tournament | null;
  inWeek: Tournament[];
  onAdvance: () => void;
  onEnterTournament: () => void;
}) {
  const isOffseason = state.currentWeek >= 46;
  return (
    <div>
      <div className="week-banner">
        <div className="wk-week">
          <small>Year {state.year}</small>
          Week {state.currentWeek}{isOffseason ? ' — Offseason' : ''}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {featured ? (
            <button className="btn" onClick={onEnterTournament}>
              ▶ Simulate {featured.name}
            </button>
          ) : (
            <button className="btn" onClick={onAdvance}>
              Next Week →
            </button>
          )}
        </div>
      </div>

      {inWeek.length > 0 && (
        <>
          <div className="section-kicker">In Play</div>
          <h2 className="section-title">This week on tour</h2>
          <hr className="rule" />
          {inWeek.map(t => (
            <TournamentCardView key={t.id} state={state} t={t} />
          ))}
        </>
      )}

      {inWeek.length === 0 && !isOffseason && <RestWeekView />}

      {isOffseason && featured === null && inWeek.length === 0 && (
        <OffseasonPlaceholder state={state} onAdvance={onAdvance} />
      )}

      <div style={{ marginTop: 30 }}>
        <NextUpcoming state={state} />
      </div>
    </div>
  );
}

function TournamentCardView({ state, t }: { state: GameState; t: Tournament }) {
  const played = !!t.winnerId;
  const winner = played ? state.players.find(p => p.id === t.winnerId) : null;
  const ru = played ? state.players.find(p => p.id === t.runnerUpId) : null;
  return (
    <div className={`tcard surface-${t.surface}`}>
      <div className="tcard-head">
        <h3 className="tcard-title">{t.name}</h3>
        <span className={`tcard-tier tier-${t.tier}`}>{t.tier}</span>
      </div>
      <div className="tcard-meta">
        <span style={{ textTransform: 'capitalize' }}>{t.surface}</span>
        <span>Wk {t.weekOfYear}{t.durationWeeks === 2 ? '–' + (t.weekOfYear + 1) : ''}</span>
        <span>Draw of {t.drawSize}</span>
        <span>Champion: {t.points.winner} pts</span>
      </div>
      {played && winner && ru && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            fontSize: 14,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-soft)',
            }}
          >
            Champion
          </span>
          <Flag iso2={winner.iso2} />
          <strong>{winner.firstName} {winner.surname}</strong>
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{t.finalScore}</span>
          <span style={{ color: 'var(--ink-mid)' }}>
            <Flag iso2={ru.iso2} size="sm" /> {ru.firstName.charAt(0)}. {ru.surname}
          </span>
        </div>
      )}
    </div>
  );
}

function RestWeekView() {
  return (
    <div style={{ padding: '36px 0', textAlign: 'center' }}>
      <div className="section-kicker">Rest week</div>
      <h2 className="section-title" style={{ marginBottom: 10 }}>No tournaments scheduled</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-mid)', maxWidth: 480, margin: '8px auto' }}>
        Players recover stamina. Click <strong>Next Week</strong> to advance.
      </p>
    </div>
  );
}

function OffseasonPlaceholder({ state, onAdvance }: { state: GameState; onAdvance: () => void }) {
  return (
    <div style={{ padding: '36px 0', textAlign: 'center' }}>
      <div className="section-kicker">Year {state.year} concluded</div>
      <h2 className="section-title">Offseason</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-mid)', maxWidth: 480, margin: '8px auto 18px' }}>
        Click <strong>Next Week</strong> to enter the offseason and review the year.
      </p>
      <button className="btn" onClick={onAdvance}>
        Enter offseason →
      </button>
    </div>
  );
}

function NextUpcoming({ state }: { state: GameState }) {
  const upcoming = state.calendar
    .filter(t => t.weekOfYear > state.currentWeek && t.weekOfYear <= state.currentWeek + 4)
    .sort((a, b) => a.weekOfYear - b.weekOfYear);
  if (upcoming.length === 0) return null;
  return (
    <div>
      <div className="section-kicker">On the horizon</div>
      <h2 className="section-title" style={{ fontSize: 20, marginBottom: 12 }}>
        Coming up
      </h2>
      <hr className="rule" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {upcoming.map(t => (
          <div
            key={t.id}
            style={{
              padding: '14px 16px',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              background: 'white',
              borderLeft: `4px solid ${
                t.surface === 'hard' ? 'var(--hard)' : t.surface === 'clay' ? 'var(--clay)' : 'var(--grass)'
              }`,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              Wk {t.weekOfYear} · {t.tier}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
