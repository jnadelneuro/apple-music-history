import React, { useState } from 'react';

import Sidebar from './Sidebar';
import ControlsBar from './ControlsBar';
import ByYearView from './ByYearView';
import ByMediaView from './ByMediaView';
import ExclusionsView from './ExclusionsView';
import OverviewView from './OverviewView';
import TrendsView from './TrendsView';
import AllSongsView from './AllSongsView';
import { availableYears } from './aggregate';

const VIEW_TITLES = {
    byYear: 'By Year',
    byMedia: 'By Media',
    exclusions: 'Exclusions',
    overview: 'Overview',
    trends: 'Trends',
    allSongs: 'All Songs'
};

function Dashboard({ results, excludedSongs, toggleExcluded, clearExcluded }) {
    const years = availableYears(results);

    const [activeView, setActiveView] = useState('byYear');
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
                { id: 'byYear', label: 'By Year' },
                { id: 'byMedia', label: 'By Media' }
            ]
        },
        {
            label: 'Manage',
            items: [
                { id: 'exclusions', label: 'Exclusions', badge: excludedSongs.length || null }
            ]
        },
        {
            label: 'More',
            items: [
                { id: 'overview', label: 'Overview' },
                { id: 'trends', label: 'Trends' },
                { id: 'allSongs', label: 'All Songs' }
            ]
        }
    ];

    const showControls = activeView === 'byYear' || activeView === 'byMedia';

    let view = null;
    if (activeView === 'byYear') {
        view = <ByYearView results={results} topX={topX} selectedYears={selectedYears} />;
    } else if (activeView === 'byMedia') {
        view = <ByMediaView results={results} topX={topX} selectedYears={selectedYears} activeTab={activeMediaTab} onTab={setActiveMediaTab} />;
    } else if (activeView === 'exclusions') {
        view = <ExclusionsView songs={results.songs} excludedSongs={excludedSongs} toggleExcluded={toggleExcluded} clearExcluded={clearExcluded} />;
    } else if (activeView === 'overview') {
        view = <OverviewView results={results} />;
    } else if (activeView === 'trends') {
        view = <TrendsView results={results} />;
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
                    />
                )}
                {view}
            </main>
        </div>
    );
}

export default Dashboard;
