import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

import Dashboard from './Dashboard';
import ByMediaView from './ByMediaView';
import ExclusionsView from './ExclusionsView';

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

it('renders the By Year dashboard with sidebar + ranked lists', () => {
    const div = renderInto(
        <Dashboard results={results} excludedSongs={[]} toggleExcluded={() => {}} clearExcluded={() => {}} />
    );
    const text = div.textContent;
    expect(text).toContain('By Year');
    expect(text).toContain('By Media');
    expect(text).toContain('Exclusions');
    expect(text).toContain('2022');
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

it('renders the Exclusions view with a toggle button', () => {
    const div = renderInto(
        <ExclusionsView songs={results.songs} excludedSongs={[]} toggleExcluded={() => {}} clearExcluded={() => {}} />
    );
    const text = div.textContent;
    expect(text).toContain('Hello');
    expect(text).toContain('Exclude');
    act(() => { ReactDOM.unmountComponentAtNode(div); });
});
