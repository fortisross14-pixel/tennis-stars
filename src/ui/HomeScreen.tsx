import React, { useState } from 'react';
import { SlotSummary, listSlots, deleteSlot } from '../sim/save';

interface Props {
  onNewGame: (slotId: 1 | 2 | 3) => void;
  onContinue: (slotId: 1 | 2 | 3) => void;
}

export function HomeScreen({ onNewGame, onContinue }: Props) {
  const [slots, setSlots] = useState<SlotSummary[]>(() => listSlots());

  const refresh = () => setSlots(listSlots());

  const handleDelete = (id: 1 | 2 | 3) => {
    if (confirm(`Delete save in slot ${id}? This cannot be undone.`)) {
      deleteSlot(id);
      refresh();
    }
  };

  return (
    <div className="home-screen">
      <div className="home-hero">
        <h1 className="home-title">
          <span className="home-title-mark">TS</span>
          Tennis Stars
        </h1>
        <p className="home-tagline">A tennis tour management sim</p>
      </div>

      <div className="home-slots-label">Choose a career slot</div>
      <div className="home-slots">
        {slots.map(slot => (
          <SlotCard
            key={slot.slotId}
            slot={slot}
            onNew={() => onNewGame(slot.slotId)}
            onContinue={() => onContinue(slot.slotId)}
            onDelete={() => handleDelete(slot.slotId)}
          />
        ))}
      </div>
    </div>
  );
}

function SlotCard({
  slot, onNew, onContinue, onDelete,
}: {
  slot: SlotSummary;
  onNew: () => void;
  onContinue: () => void;
  onDelete: () => void;
}) {
  if (slot.empty) {
    return (
      <div className="slot-card empty">
        <div className="slot-num">Slot {slot.slotId}</div>
        <div className="slot-empty-text">— Empty —</div>
        <button className="btn" onClick={onNew}>Start new career</button>
      </div>
    );
  }
  const savedDate = slot.savedAt ? new Date(slot.savedAt) : null;
  const dateStr = savedDate
    ? savedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
      savedDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '';
  return (
    <div className="slot-card filled">
      <div className="slot-num">Slot {slot.slotId}</div>
      <div className="slot-meta">
        <div className="slot-year">Year {slot.year}</div>
        <div className="slot-week">Week {slot.week}</div>
      </div>
      {slot.topPlayer && (
        <div className="slot-top">
          <span className="slot-top-label">Race leader</span>
          <span className="slot-top-name">{slot.topPlayer}</span>
        </div>
      )}
      <div className="slot-saved">Saved · {dateStr}</div>
      <div className="slot-actions">
        <button className="btn" onClick={onContinue}>Continue</button>
        <button className="btn btn-outline" onClick={onNew}>New game</button>
        <button className="slot-delete" onClick={onDelete} title="Delete save">✕</button>
      </div>
    </div>
  );
}
