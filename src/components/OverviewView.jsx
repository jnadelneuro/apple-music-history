import React from 'react';
import TopSongBox from './TopSongBox';
import TotalsBoxes from './TotalsBoxes';
import Wrapped from './Wrapped';

function OverviewView({ results }) {
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
            {results.thisYear.totalPlays > 1 && (
                <Wrapped year={results.thisYear} songs={results.thisYear.songs} />
            )}
        </div>
    );
}

export default OverviewView;
