import React from 'react';
import TopSongBox from './TopSongBox';
import TotalsBoxes from './TotalsBoxes';
import Wrapped from './Wrapped';
import RankedList from './RankedList';

/**
 * All Time: overall summary (top song + totals) plus all-time top X
 * songs / artists / albums, aggregated across every year.
 */
function AllTimeView({ results, topX }) {
    const topSong = results.filteredSongs[0];
    return (
        <div>
            {topSong && <TopSongBox song={topSong} />}
            <TotalsBoxes
                totals={results.totals}
                songs={results.songs.length}
                artists={results.artists.length}
                day={results.days[0]}
            />
            <div className="amh-cols" style={{ marginTop: 18 }}>
                <RankedList title="Top Songs" kind="song" limit={topX} entries={results.filteredSongs} />
                <RankedList title="Top Artists" kind="artist" limit={topX} entries={results.artists} />
                <RankedList title="Top Albums" kind="album" limit={topX} entries={results.albums} />
            </div>
            {results.thisYear.totalPlays > 1 && (
                <Wrapped year={results.thisYear} songs={results.thisYear.songs} />
            )}
        </div>
    );
}

export default AllTimeView;
