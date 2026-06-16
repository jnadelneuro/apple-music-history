import React, { useState } from 'react';
import numeral from 'numeral';
import Computation from './Computation';

const MAX_RESULTS = 80;

function Row({ entry, excluded, onToggle }) {
    return (
        <div className={'amh-excl__row' + (excluded ? ' is-excluded' : '')}>
            <div className="amh-rank__body">
                <div className="amh-rank__name">{entry.value.name || entry.key}</div>
                <div className="amh-rank__sub">
                    {entry.value.artist} · {numeral(entry.value.plays).format('0,0')} plays · {Computation.convertTime(entry.value.time)}
                </div>
            </div>
            <button
                className={'amh-btn' + (excluded ? '' : ' amh-btn--accent')}
                onClick={() => onToggle(entry.key)}
            >
                {excluded ? 'Include' : 'Exclude'}
            </button>
        </div>
    );
}

/**
 * Manage which songs are dropped from every stat. Excluding re-runs the
 * computation upstream, so it removes the song from By Year, By Media and totals too.
 */
function ExclusionsView({ songs, excludedSongs, toggleExcluded, clearExcluded }) {
    const [query, setQuery] = useState('');
    const excludedSet = new Set(excludedSongs);

    const excluded = songs.filter((s) => excludedSet.has(s.key));

    const q = query.trim().toLowerCase();
    const matches = songs
        .filter((s) => !excludedSet.has(s.key))
        .filter((s) => {
            if (!q) return true;
            const name = (s.value.name || s.key).toLowerCase();
            const artist = (s.value.artist || '').toLowerCase();
            return name.includes(q) || artist.includes(q);
        })
        .slice(0, MAX_RESULTS);

    return (
        <div>
            {excluded.length > 0 && (
                <div className="amh-card" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 className="amh-card__title" style={{ margin: 0 }}>Excluded ({excluded.length})</h3>
                        <button className="amh-btn" onClick={clearExcluded}>Clear all</button>
                    </div>
                    {excluded.map((s) => (
                        <Row key={s.key} entry={s} excluded onToggle={toggleExcluded} />
                    ))}
                </div>
            )}

            <input
                className="amh-excl__search"
                placeholder="Search songs to exclude…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {matches.map((s) => (
                <Row key={s.key} entry={s} excluded={false} onToggle={toggleExcluded} />
            ))}
            {matches.length === 0 && <div className="amh-empty">No songs match “{query}”.</div>}
        </div>
    );
}

export default ExclusionsView;
