import React from 'react';
import { Button } from 'reactstrap';
import AllSongsTable from './AllSongsTable';

function AllSongsView({ results, excludedSongs, toggleExcluded, clearExcluded }) {
    return (
        <div className="box">
            <div className="title-flex" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <h1 style={{ margin: 0 }}>All Songs</h1>
                <Button outline color="secondary" size="sm" onClick={clearExcluded} active={excludedSongs.length > 0}>
                    Clear Excluded ({excludedSongs.length})
                </Button>
            </div>
            <AllSongsTable addExcluded={(row) => toggleExcluded(row.original.key)} songs={results.songs} />
        </div>
    );
}

export default AllSongsView;
