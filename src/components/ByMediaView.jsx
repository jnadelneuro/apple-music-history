import React from 'react';
import RankedList from './RankedList';
import { mergeYears } from './aggregate';

const TABS = [
    { id: 'albums', label: 'Albums', kind: 'album', source: 'yearAlbums' },
    { id: 'songs', label: 'Songs', kind: 'song', source: 'years' },
    { id: 'artists', label: 'Artists', kind: 'artist', source: 'yearArtists' }
];

/**
 * By Media: a media-type tab (Albums / Songs / Artists), showing the top X items
 * aggregated across the selected years.
 */
function ByMediaView({ results, topX, selectedYears, activeTab, onTab }) {
    const tab = TABS.find((t) => t.id === activeTab) || TABS[0];
    const merged = mergeYears(results[tab.source], selectedYears);
    const yearLabel = selectedYears.length === 0
        ? 'no years selected'
        : `${selectedYears.length} year${selectedYears.length > 1 ? 's' : ''} selected`;

    return (
        <div>
            <div className="amh-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        className={'amh-tab' + (t.id === tab.id ? ' is-active' : '')}
                        onClick={() => onTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <RankedList
                title={`Top ${tab.label} — ${yearLabel}`}
                kind={tab.kind}
                limit={topX}
                entries={merged}
            />
        </div>
    );
}

export default ByMediaView;
