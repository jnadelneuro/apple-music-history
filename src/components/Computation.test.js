import Computation from './Computation';

// Rows shaped like the trimmed "Apple Music Play Activity.csv".
function play(o) {
    return {
        'Song Name': o.song,
        'Album Name': o.album,
        'Play Duration Milliseconds': String(o.played),
        'Media Duration In Milliseconds': String(o.media),
        'Start Position In Milliseconds': String(o.start ?? 0),
        'End Position In Milliseconds': String(o.end ?? o.played),
        'Event End Timestamp': o.ts,
        'End Reason Type': o.reason || 'NATURAL_END_OF_TRACK',
        'UTC Offset In Seconds': '0',
        'Item Type': 'ITUNES_STORE_CONTENT',
        'Media Type': 'AUDIO'
    };
}

const library = [
    { Title: 'Bohemian Rhapsody', Album: 'A Night at the Opera', Artist: 'Queen' },
    { Title: 'Hello', Album: '25', Artist: 'Adele' }
];

describe('Computation.calculateTop (play activity)', () => {
    test('aggregates plays, time and precise skipped time', (done) => {
        const data = [
            play({ song: 'Bohemian Rhapsody', album: 'A Night at the Opera', played: 354000, media: 354000, end: 354000, ts: '2022-01-15T14:30:00Z' }),
            play({ song: 'Bohemian Rhapsody', album: 'A Night at the Opera', played: 100000, media: 354000, end: 100000, ts: '2022-02-20T10:00:00Z', reason: 'TRACK_SKIPPED_FORWARDS' }),
            play({ song: 'Hello', album: '25', played: 200000, media: 295000, end: 200000, ts: '2022-03-10T16:00:00Z' })
        ];
        Computation.calculateTop(data, [], (r) => {
            const top = r.songs[0];
            expect(top.key).toBe("'Bohemian Rhapsody' by Queen");
            expect(top.value.plays).toBe(2);
            expect(top.value.time).toBe(454000);
            // skipped = (354000-354000) + (354000-100000) = 254000
            expect(top.value.missedTime).toBe(254000);

            expect(r.artists[0].key).toBe('Queen');
            expect(r.totals.totalPlays).toBe(3);
            done();
        }, library);
    });

    test('albums come natively from Play Activity (no library needed)', (done) => {
        const data = [
            play({ song: 'Bohemian Rhapsody', album: 'A Night at the Opera', played: 354000, media: 354000, ts: '2022-01-15T14:30:00Z' }),
            play({ song: 'Hello', album: '25', played: 200000, media: 295000, ts: '2022-03-10T16:00:00Z' })
        ];
        Computation.calculateTop(data, [], (r) => {
            const albumKeys = r.albums.map(a => a.key);
            expect(albumKeys).toContain('A Night at the Opera');
            expect(albumKeys).toContain('25');
            done();
        }); // no library passed
    });

    test('collapses a paused-then-resumed play into one play', (done) => {
        const data = [
            play({ song: 'Resumed', album: 'R', played: 50000, media: 200000, start: 0, end: 50000, ts: '2022-04-01T12:00:00Z', reason: 'PLAYBACK_MANUALLY_PAUSED' }),
            play({ song: 'Resumed', album: 'R', played: 150000, media: 200000, start: 50000, end: 200000, ts: '2022-04-01T12:05:00Z', reason: 'NATURAL_END_OF_TRACK' })
        ];
        Computation.calculateTop(data, [], (r) => {
            const song = r.songs.find(s => s.value.name === 'Resumed');
            expect(song.value.plays).toBe(1);          // one play, not two
            expect(song.value.time).toBe(200000);       // both segments summed
            expect(song.value.missedTime).toBe(0);      // fully listened across segments
            done();
        });
    });

    test('ignores plays shorter than 8 seconds but still counts the reason', (done) => {
        const data = [
            play({ song: 'Skipped Quick', album: 'Q', played: 5000, media: 200000, end: 5000, ts: '2022-05-01T12:00:00Z', reason: 'TRACK_SKIPPED_FORWARDS' }),
            play({ song: 'Real Play', album: 'Q', played: 180000, media: 180000, ts: '2022-05-01T12:10:00Z' })
        ];
        Computation.calculateTop(data, [], (r) => {
            expect(r.songs.find(s => s.value.name === 'Skipped Quick')).toBeUndefined();
            expect(r.songs.find(s => s.value.name === 'Real Play')).toBeDefined();
            const reasons = Object.fromEntries(r.reasons.map(x => [x.key, x.value]));
            expect(reasons['TRACK_SKIPPED_FORWARDS']).toBe(1);
            done();
        });
    });

    test('splits results by year and respects excluded songs', (done) => {
        const data = [
            play({ song: 'Bohemian Rhapsody', album: 'A Night at the Opera', played: 354000, media: 354000, ts: '2021-01-15T14:30:00Z' }),
            play({ song: 'Hello', album: '25', played: 200000, media: 295000, ts: '2021-06-10T16:00:00Z' }),
            play({ song: 'Hello', album: '25', played: 200000, media: 295000, ts: '2022-03-10T16:00:00Z' })
        ];
        Computation.calculateTop(data, ["'Bohemian Rhapsody' by Queen"], (r) => {
            const years = r.years.map(y => y.key).sort();
            expect(years).toEqual(['2021', '2022']);
            expect(r.filteredSongs.find(s => s.key === "'Bohemian Rhapsody' by Queen")).toBeUndefined();
            expect(r.artists.find(a => a.key === 'Queen')).toBeUndefined();
            done();
        }, library);
    });
});
