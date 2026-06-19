import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

import Dashboard from './Dashboard';
import ByMediaView from './ByMediaView';
import ExclusionsView from './ExclusionsView';
import SearchView from './SearchView';
import DetailView from './DetailView';
import { buildSearchItems } from './detail';

const results = {
    years: [{ key: '2022', value: [{ key: "'Hello' by Adele", value: { plays: 5, time: 1000, name: 'Hello', artist: 'Adele', missedTime: 0 } }] }],
    yearArtists: [{ key: '2022', value: [{ key: 'Adele', value: { plays: 5, time: 1000, missedTime: 0 } }] }],
    yearAlbums: [{ key: '2022', value: [{ key: '25', value: { plays: 5, time: 1000, missedTime: 0 } }] }],
    songs: [{ key: "'Hello' by Adele", value: { plays: 5, time: 1000, name: 'Hello', artist: 'Adele', excluded: false } }],
    artists: [{ key: 'Adele', value: { plays: 5, time: 1000 } }],
    albums: [{ key: '25', value: { plays: 5, time: 1000 } }],
    totals: { totalPlays: 5, totalTime: 1000, totalLyrics: 0 },
    days: [{ key: '1 January, 2022', value: { plays: 5, time: 1000 } }],
    months: [{ key: '2022-January', value: { plays: 5, time: 1000, missedTime: 0 } }],
    hoursArray: Array.from({ length: 7 }, () => new Array(24).fill(0)),
    thisYear: { totalPlays: 0, totalTime: 0, year: 2026, artists: [], songs: [] },
    filteredSongs: [{ key: "'Hello' by Adele", value: { plays: 5, time: 1000, name: 'Hello', artist: 'Adele' } }]
};

function renderInto(el) {
    const div = document.createElement('div');
    act(() => { ReactDOM.render(el, div); });
    return div;
}

it('renders the All Time dashboard (default) with sidebar + ranked lists', () => {
    const div = renderInto(
        <Dashboard results={results} excludedSongs={[]} toggleExcluded={() => {}} clearExcluded={() => {}} />
    );
    const text = div.textContent;
    expect(text).toContain('All Time');         // default view title + sidebar item
    expect(text).toContain('By Year');
    expect(text).toContain('By Media');
    expect(text).toContain('Listening Trends');
    expect(text).toContain('Exclusions');
    expect(text).toContain('Hello');   // song
    expect(text).toContain('Adele');   // artist
    expect(text).toContain('25');      // album
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});

it('renders the By Media tabs and an aggregated list', () => {
    const div = renderInto(
        <ByMediaView results={results} topX={10} selectedYears={['2022']} activeTab="albums" onTab={() => {}} />
    );
    const text = div.textContent;
    expect(text).toContain('Albums');
    expect(text).toContain('Songs');
    expect(text).toContain('Artists');
    expect(text).toContain('25');
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});

it('renders search results for a query', () => {
    const items = buildSearchItems(results);
    const div = renderInto(<SearchView items={items} query="hel" onSelect={() => {}} />);
    expect(div.textContent).toContain('Hello');
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});

it('renders an entity detail page with breakdowns', () => {
    const rows = [{
        'Song Name': 'Hello', 'Album Name': '25',
        'Play Duration Milliseconds': '200000', 'Media Duration In Milliseconds': '295000',
        'Start Position In Milliseconds': '0', 'End Position In Milliseconds': '200000',
        'Event End Timestamp': '2021-03-10T15:00:00Z', 'End Reason Type': 'NATURAL_END_OF_TRACK',
        'UTC Offset In Seconds': '0', 'Item Type': 'ITUNES_STORE_CONTENT', 'Media Type': 'AUDIO'
    }];
    const div = renderInto(
        <DetailView
            data={rows}
            libraryData={[{ Title: 'Hello', Album: '25', Artist: 'Adele' }]}
            dailyTracksData={null}
            entity={{ type: 'song', name: 'Hello', artist: 'Adele' }}
            onBack={() => {}}
        />
    );
    const text = div.textContent;
    expect(text).toContain('By Year');
    expect(text).toContain('By Day of Week');
    expect(text).toContain('By Hour of Day');
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});

it('renders the Exclusions view with a toggle button', () => {
    const div = renderInto(
        <ExclusionsView songs={results.songs} excludedSongs={[]} toggleExcluded={() => {}} clearExcluded={() => {}} />
    );
    const text = div.textContent;
    expect(text).toContain('Hello');
    expect(text).toContain('Exclude');
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});
