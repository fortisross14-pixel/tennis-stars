import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameState, Tournament, YearSummary, Player } from './sim/types';
import { initGameState, advanceWeek, isOffseasonWeek } from './sim/engine';
import { buildCalendarForYear, tournamentsStartingInWeek, tournamentsInWeek } from './sim/calendar';
import { runOffseason } from './sim/offseason';
import { CalendarView } from './ui/CalendarView';
import { RankingView } from './ui/RankingView';
import { HistoryView } from './ui/HistoryView';
import { TournamentRunner } from './ui/TournamentRunner';
import { OffseasonView } from './ui/OffseasonView';
import { HomeScreen } from './ui/HomeScreen';
import { PlayerModal } from './ui/PlayerModal';
import { TournamentModal } from './ui/TournamentModal';
import { Flag } from './ui/common';
import { loadSlot, saveSlot } from './sim/save';

type Tab = 'current' | 'ranking' | 'calendar' | 'history';

export default function App() {
  // Slot management: null = at home screen
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3 | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>('current');
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [offseasonSummary, setOffseasonSummary] = useState<YearSummary | null>(null);

  // Modal state
  const [playerModal, setPlayerModal] = useState<Player | null>(null);
  const [tournamentModal, setTournamentModal] = useState<Tournament | null>(null);

  // Autosave whenever state changes (debounced via the natural re-render cadence)
  useEffect(() => {
    if (activeSlot && state) {
      saveSlot(activeSlot, state);
    }
  }, [activeSlot, state]);

  const openPlayer = useCallback((p: Player) => setPlayerModal(p), []);
  const openTournament = useCallback((t: Tournament) => setTournamentModal(t), []);

  // === HOME SCREEN ===
  if (!state || !activeSlot) {
    return (
      <HomeScreen
        onNewGame={(slotId) => {
          const fresh = initGameState();
          setActiveSlot(slotId);
          setState(fresh);
          setTab('current');
          setActiveTournament(null);
          setOffseasonSummary(null);
        }}
        onContinue={(slotId) => {
          const saved = loadSlot(slotId);
          if (saved) {
            setActiveSlot(slotId);
            setState(saved.state);
            setTab('current');
            setActiveTournament(null);
            setOffseasonSummary(null);
          }
        }}
      />
    );
  }

  // ===== IN-GAME =====
  const inWeek = tournamentsInWeek(state.calendar, state.currentWeek);
  const featuredThisWeek = (() => {
    const starting = tournamentsStartingInWeek(state.calendar, state.currentWeek);
    if (starting.length === 0) return null;
    return starting.filter(t => !t.winnerId)[0] || null;
  })();

  const goHome = () => {
    if (activeSlot && state) saveSlot(activeSlot, state); // final save
    setActiveSlot(null);
    setState(null);
    setActiveTournament(null);
    setOffseasonSummary(null);
  };

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

  // Offseason wizard
  if (offseasonSummary) {
    return (
      <>
        <Masthead state={state} onHome={goHome} />
        <main>
          <OffseasonView state={state} summary={offseasonSummary} onDone={handleStartNewYear} />
        </main>
        <PlayerModal player={playerModal} state={state} onClose={() => setPlayerModal(null)} />
        <TournamentModal
          tournament={tournamentModal}
          state={state}
          onClose={() => setTournamentModal(null)}
          onPlayerClick={openPlayer}
        />
      </>
    );
  }

  // Tournament runner
  if (activeTournament) {
    return (
      <>
        <Masthead state={state} onHome={goHome} />
        <main>
          <TournamentRunner
            state={state}
            setState={setState}
            tournament={activeTournament}
            onPlayerClick={openPlayer}
            onClose={() => {
              setActiveTournament(null);
              const tourEndWeek = activeTournament.weekOfYear + activeTournament.durationWeeks - 1;
              const newAbs = (state.year - 1) * 52 + tourEndWeek;
              setState(prev => prev ? ({
                ...prev,
                currentWeek: tourEndWeek,
                absoluteWeek: newAbs,
              }) : prev);
            }}
          />
        </main>
        <PlayerModal player={playerModal} state={state} onClose={() => setPlayerModal(null)} />
      </>
    );
  }

  return (
    <>
      <Masthead state={state} onHome={goHome} />
      <div className="nav-wrap">
        <nav className="nav">
          <button className={`nav-tab ${tab === 'current' ? 'active' : ''}`} onClick={() => setTab('current')}>
            This Week
          </button>
          <button className={`nav-tab ${tab === 'ranking' ? 'active' : ''}`} onClick={() => setTab('ranking')}>
            Rankings
          </button>
          <button className={`nav-tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
            Calendar
          </button>
          <button className={`nav-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
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
            onPlayerClick={openPlayer}
            onTournamentClick={openTournament}
          />
        )}
        {tab === 'ranking' && <RankingView state={state} setState={setState} onPlayerClick={openPlayer} />}
        {tab === 'calendar' && <CalendarView state={state} onTournamentClick={openTournament} />}
        {tab === 'history' && <HistoryView state={state} onPlayerClick={openPlayer} onTournamentClick={openTournament} />}
      </main>

      <PlayerModal player={playerModal} state={state} onClose={() => setPlayerModal(null)} />
      <TournamentModal
        tournament={tournamentModal}
        state={state}
        onClose={() => setTournamentModal(null)}
        onPlayerClick={(p) => { setTournamentModal(null); openPlayer(p); }}
      />
    </>
  );
}

function Masthead({ state, onHome }: { state: GameState; onHome: () => void }) {
  const active = state.players.filter(p => !p.retired).length;
  return (
    <header className="masthead">
      <h1 className="mast-title" onClick={onHome} style={{ cursor: 'pointer' }} title="Back to home">
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
  state, featured, inWeek, onAdvance, onEnterTournament, onPlayerClick, onTournamentClick,
}: {
  state: GameState;
  featured: Tournament | null;
  inWeek: Tournament[];
  onAdvance: () => void;
  onEnterTournament: () => void;
  onPlayerClick: (p: Player) => void;
  onTournamentClick: (t: Tournament) => void;
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
            <div key={t.id} onClick={() => onTournamentClick(t)} style={{ cursor: 'pointer' }}>
              <TournamentCardView state={state} t={t} onPlayerClick={onPlayerClick} />
            </div>
          ))}
        </>
      )}

      {inWeek.length === 0 && !isOffseason && <RestWeekView />}

      {isOffseason && featured === null && inWeek.length === 0 && (
        <OffseasonPlaceholder state={state} onAdvance={onAdvance} />
      )}

      <div style={{ marginTop: 30 }}>
        <NextUpcoming state={state} onTournamentClick={onTournamentClick} />
      </div>
    </div>
  );
}

function TournamentCardView({
  state, t, onPlayerClick,
}: {
  state: GameState;
  t: Tournament;
  onPlayerClick: (p: Player) => void;
}) {
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
            marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft)' }}>
            Champion
          </span>
          <Flag iso2={winner.iso2} />
          <button className="link-name" onClick={() => onPlayerClick(winner)}>
            <strong>{winner.firstName} {winner.surname}</strong>
          </button>
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{t.finalScore}</span>
          <span style={{ color: 'var(--ink-mid)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Flag iso2={ru.iso2} size="sm" />
            <button className="link-name link-name-soft" onClick={() => onPlayerClick(ru)}>
              {ru.firstName.charAt(0)}. {ru.surname}
            </button>
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

function NextUpcoming({ state, onTournamentClick }: { state: GameState; onTournamentClick: (t: Tournament) => void }) {
  const upcoming = state.calendar
    .filter(t => t.weekOfYear > state.currentWeek && t.weekOfYear <= state.currentWeek + 4)
    .sort((a, b) => a.weekOfYear - b.weekOfYear);
  if (upcoming.length === 0) return null;
  return (
    <div>
      <div className="section-kicker">On the horizon</div>
      <h2 className="section-title" style={{ fontSize: 20, marginBottom: 12 }}>Coming up</h2>
      <hr className="rule" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {upcoming.map(t => (
          <div
            key={t.id}
            onClick={() => onTournamentClick(t)}
            style={{
              padding: '14px 16px', border: '1px solid var(--rule)', borderRadius: 8,
              background: 'white', boxShadow: 'var(--shadow-card)',
              borderLeft: `4px solid ${t.surface === 'hard' ? 'var(--hard)' : t.surface === 'clay' ? 'var(--clay)' : 'var(--grass)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft)', marginBottom: 4 }}>
              Wk {t.weekOfYear} · {t.tier}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
