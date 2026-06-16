import React from 'react';
import numeral from 'numeral';
import Computation from './Computation';

/**
 * A titled, ranked list of entries. `kind` controls how each entry's name/subtitle
 * is read from the standard `{key, value:{plays,time,name,artist}}` shape:
 *   - 'song'   -> name = value.name, subtitle = value.artist
 *   - 'artist' -> name = key
 *   - 'album'  -> name = key
 */
function RankedList({ title, entries, kind, limit }) {
    // "Unknown Artist" is a placeholder, not a real artist — keep it out of artist charts.
    const source = kind === 'artist'
        ? (entries || []).filter((e) => e.key !== 'Unknown Artist')
        : (entries || []);
    const items = source.slice(0, limit);

    return (
        <div className="amh-card">
            {title && <h3 className="amh-card__title">{title}</h3>}
            {items.length === 0 ? (
                <div className="amh-empty">No data</div>
            ) : (
                <ol className="amh-rank">
                    {items.map((entry, i) => {
                        const name = kind === 'song' ? (entry.value.name || entry.key) : entry.key;
                        const subtitle = kind === 'song' ? entry.value.artist : null;
                        return (
                            <li className="amh-rank__item" key={entry.key}>
                                <span className="amh-rank__num">{i + 1}</span>
                                <div className="amh-rank__body">
                                    <div className="amh-rank__name" title={name}>{name}</div>
                                    {subtitle && <div className="amh-rank__sub" title={subtitle}>{subtitle}</div>}
                                </div>
                                <div className="amh-rank__meta">
                                    <strong>{numeral(entry.value.plays).format('0,0')} plays</strong>
                                    {Computation.convertTime(entry.value.time)}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}

export default RankedList;
