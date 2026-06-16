import React from 'react';
import RankedList from './RankedList';
import { availableYears, yearSlice } from './aggregate';

/**
 * By Year: one stacked section per selected year (newest first), each showing
 * three columns — top X Songs, Artists, Albums for that year.
 */
function ByYearView({ results, topX, selectedYears }) {
    const selected = new Set(selectedYears.map(String));
    const years = availableYears(results).filter((y) => selected.has(y));

    if (years.length === 0) {
        return <div className="amh-empty">Select one or more years above to see your top music.</div>;
    }

    return (
        <div>
            {years.map((year) => (
                <section className="amh-year-section" key={year}>
                    <div className="amh-year-section__head">
                        <span className="amh-year-section__year">{year}</span>
                        <span className="amh-year-section__line" />
                    </div>
                    <div className="amh-cols">
                        <RankedList title="Songs" kind="song" limit={topX} entries={yearSlice(results.years, year)} />
                        <RankedList title="Artists" kind="artist" limit={topX} entries={yearSlice(results.yearArtists, year)} />
                        <RankedList title="Albums" kind="album" limit={topX} entries={yearSlice(results.yearAlbums, year)} />
                    </div>
                </section>
            ))}
        </div>
    );
}

export default ByYearView;
