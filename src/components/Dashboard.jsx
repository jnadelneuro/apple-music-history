import React, { useState } from 'react';

import Sidebar from './Sidebar';
import ControlsBar from './ControlsBar';
import ByYearView from './ByYearView';
import ByMediaView from './ByMediaView';
import ExclusionsView from './ExclusionsView';
import AllTimeView from './AllTimeView';
import TrendsView from './TrendsView';
import AllSongsView from './AllSongsView';
import { availableYears } from './aggregate';

const VIEW_TITLES = {
    allTime: 'All Time',
    byYear: 'By Year',
    byMedia: 'By Media',
    trends: 'Listening Trends',
    exclusions: 'Exclusions',
    allSongs: 'All Songs'
};

function Dashboard({ results, excludedSongs, toggleExcluded, clearExcluded }) {
    const years = availableYears(results);

    const [activeView, setActiveView] = useState('allTime');
    const [topX, setTopX] = useState(10);
    const [selectedYears, setSelectedYears] = useState(years);
    const [activeMediaTab, setActiveMediaTab] = useState('albums');

    const toggleYear = (y) => {
        const key = String(y);
        setSelectedYears((prev) =>
            prev.map(String).includes(key) ? prev.filter((p) => String(p) !== key) : [...prev, key]
        );
    };

    const groups = [
        {
            label: 'Top Charts',
            items: [
                { id: 'allTime', label: 'All Time' },
                { id: 'byYear', label: 'By Year' },
                { id: 'byMedia', label: 'By Media' }
            ]
        },
        {
            label: 'Insights',
            items: [
                { id: 'trends', label: 'Listening Trends' }
            ]
        },
        {
            label: 'Manage',
            items: [
                { id: 'exclusions', label: 'Exclusions', badge: excludedSongs.length || null },
                { id: 'allSongs', label: 'All Songs' }
            ]
        }
    ];

    const showControls = activeView === 'allTime' || activeView === 'byYear' || activeView === 'byMedia';
    const showYears = activeView !== 'allTime';

    let view = null;
    if (activeView === 'allTime') {
        view = <AllTimeView results={results} topX={topX} />;
    } else if (activeView === 'byYear') {
        view = <ByYearView results={results} topX={topX} selectedYears={selectedYears} />;
    } else if (activeView === 'byMedia') {
        view = <ByMediaView results={results} topX={topX} selectedYears={selectedYears} activeTab={activeMediaTab} onTab={setActiveMediaTab} />;
    } else if (activeView === 'trends') {
        view = <TrendsView results={results} />;
    } else if (activeView === 'exclusions') {
        view = <ExclusionsView songs={results.songs} excludedSongs={excludedSongs} toggleExcluded={toggleExcluded} clearExcluded={clearExcluded} />;
    } else if (activeView === 'allSongs') {
        view = <AllSongsView results={results} excludedSongs={excludedSongs} toggleExcluded={toggleExcluded} clearExcluded={clearExcluded} />;
    }

    return (
        <div className="amh-dashboard">
            <Sidebar groups={groups} activeView={activeView} onSelect={setActiveView} />
            <main className="amh-main">
                <h1 className="amh-main__title">{VIEW_TITLES[activeView]}</h1>
                {showControls && (
                    <ControlsBar
                        topX={topX}
                        onTopX={setTopX}
                        years={years}
                        selectedYears={selectedYears}
                        onToggleYear={toggleYear}
                        onAllYears={() => setSelectedYears(years)}
                        onNoneYears={() => setSelectedYears([])}
                        showYears={showYears}
                    />
                )}
                {view}
            </main>
        </div>
    );
}

export default Dashboard;
