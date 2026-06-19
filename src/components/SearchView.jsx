import React from 'react';
import numeral from 'numeral';
import { searchItems } from './detail';

const TYPE_LABEL = { song: 'Song', artist: 'Artist', album: 'Album' };

function SearchView({ items, query, onSelect }) {
    if (!query.trim()) {
        return <div className="amh-empty">Search for a song, artist, or album to see when you listened to it.</div>;
    }
    const results = searchItems(items, query);
    if (results.length === 0) {
        return <div className="amh-empty">No matches for “{query}”.</div>;
    }

    return (
        <div>
            {results.map((it) => (
                <button
                    className="amh-search-result"
                    key={it.type + '|' + it.key}
                    onClick={() => onSelect(it)}
                >
                    <span className="amh-search-result__type">{TYPE_LABEL[it.type]}</span>
                    <span className="amh-search-result__body">
                        <span className="amh-rank__name">{it.type === 'song' ? it.name : it.key}</span>
                        {it.type === 'song' && <span className="amh-rank__sub">{it.artist}</span>}
                    </span>
                    <span className="amh-rank__meta">{numeral(it.plays).format('0,0')} plays</span>
                </button>
            ))}
        </div>
    );
}

export default SearchView;
