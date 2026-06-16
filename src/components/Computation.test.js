import Computation from './Computation';

// Rows shaped like "Apple Music - Play History Daily Tracks.csv".
const dailyData = [
    {
        'Track Description': 'Queen - Bohemian Rhapsody',
        'Track Identifier': '1000',
        'Date Played': '20220115',
        'Hours': '14',
        'Play Duration Milliseconds': '700000',
        'End Reason Type': 'NATURAL_END_OF_TRACK',
        'Play Count': '2',
        'Skip Count': '0'
    },
    {
        'Track Description': 'Queen - Bohemian Rhapsody',
        'Track Identifier': '1000',
        'Date Played': '20220220',
        'Hours': '9, 10',
        'Play Duration Milliseconds': '350000',
        'End Reason Type': 'NATURAL_END_OF_TRACK',
        'Play Count': '1',
        'Skip Count': '0'
    },
    {
        'Track Description': 'Adele - Hello',
        'Track Identifier': '2000',
        'Date Played': '20220310',
        'Hours': '20',
        'Play Duration Milliseconds': '200000',
        'End Reason Type': 'TRACK_SKIPPED_FORWARDS',
        'Play Count': '1',
        'Skip Count': '2'
    },
    {
        // Same title "Hello" but a different artist -> must stay distinct.
        'Track Description': 'Drake - Hello',
        'Track Identifier': '3000',
        'Date Played': '20210610',
        'Hours': '8',
        'Play Duration Milliseconds': '180000',
        'End Reason Type': 'NATURAL_END_OF_TRACK',
        'Play Count': '1',
        'Skip Count': '0'
    }
];

const library = [
    { Title: 'Bohemian Rhapsody', Artist: 'Queen', Album: 'A Night at the Opera', 'Track Duration': 354000, 'Apple Music Track Identifier': '1000' },
    { Title: 'Hello', Artist: 'Adele', Album: '25', 'Track Duration': 295000, 'Apple Music Track Identifier': '2000' }
    // id 3000 (Drake - Hello) intentionally absent -> Unknown Album
];

describe('Computation.calculateTop (daily tracks)', () => {
    test('aggregates songs and artists from Track Description without a library', (done) => {
        Computation.calculateTop(dailyData, [], (r) => {
            expect(r.songs.length).toBe(3);
            const top = r.songs[0];
            expect(top.key).toBe("'Bohemian Rhapsody' by Queen");
            expect(top.value.plays).toBe(3);
            expect(top.value.artist).toBe('Queen');

            // Same title, different artist must not collapse together.
            const hellos = r.songs.filter(s => s.value.name === 'Hello');
            expect(hellos.length).toBe(2);

            // Skip counts captured from the daily rows.
            const adele = r.songs.find(s => s.key === "'Hello' by Adele");
            expect(adele.value.skips).toBe(2);

            expect(r.totals.totalPlays).toBe(5);
            done();
        });
    });

    test('no library means no album analytics', (done) => {
        Computation.calculateTop(dailyData, [], (r) => {
            expect(r.albums.length).toBe(0);
            done();
        });
    });

    test('library join attributes albums by track id and excludes Unknown Album', (done) => {
        Computation.calculateTop(dailyData, [], (r) => {
            const albumKeys = r.albums.map(a => a.key);
            expect(albumKeys).toContain('A Night at the Opera');
            expect(albumKeys).toContain('25');
            // Drake - Hello is not in the library, so it must not pollute albums.
            expect(albumKeys).not.toContain('Unknown Album');
            expect(r.albums.length).toBe(2);

            const opera = r.albums.find(a => a.key === 'A Night at the Opera');
            expect(opera.value.plays).toBe(3);
            done();
        }, library);
    });

    test('splits results by year', (done) => {
        Computation.calculateTop(dailyData, [], (r) => {
            const years = r.years.map(y => y.key).sort();
            expect(years).toEqual(['2021', '2022']);

            const y2021 = r.years.find(y => y.key === '2021');
            expect(y2021.value[0].value.artist).toBe('Drake');
            done();
        }, library);
    });

    test('respects excluded songs', (done) => {
        const excluded = ["'Bohemian Rhapsody' by Queen"];
        Computation.calculateTop(dailyData, excluded, (r) => {
            // Excluded song is still listed but kept out of artist totals.
            expect(r.filteredSongs.find(s => s.key === excluded[0])).toBeUndefined();
            expect(r.artists.find(a => a.key === 'Queen')).toBeUndefined();
            expect(r.totals.totalPlays).toBe(2); // only the two Hellos remain
            done();
        }, library);
    });

    test('counts end reasons weighted by play and skip counts', (done) => {
        Computation.calculateTop(dailyData, [], (r) => {
            const reasons = Object.fromEntries(r.reasons.map(x => [x.key, x.value]));
            expect(reasons['NATURAL_END_OF_TRACK']).toBe(4); // 2 + 1 + 1
            expect(reasons['TRACK_SKIPPED_FORWARDS']).toBe(3); // 1 play + 2 skips
            done();
        });
    });
});
