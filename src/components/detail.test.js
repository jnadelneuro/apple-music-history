import ArtistResolver from './ArtistResolver';
import { computeEntityDetail, buildSearchItems, searchItems } from './detail';

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

const resolver = new ArtistResolver(
    [{ Title: 'Hello', Album: '25', Artist: 'Adele' }, { Title: 'Other', Album: 'X', Artist: 'Z' }],
    null
);

const data = [
    play({ song: 'Hello', album: '25', played: 200000, media: 295000, end: 200000, ts: '2021-03-10T15:00:00Z' }),
    play({ song: 'Hello', album: '25', played: 100000, media: 295000, end: 100000, ts: '2022-06-20T09:00:00Z', reason: 'TRACK_SKIPPED_FORWARDS' }),
    play({ song: 'Other', album: 'X', played: 50000, media: 60000, ts: '2022-06-21T09:00:00Z' })
];

describe('detail.computeEntityDetail', () => {
    test('buckets a song by year with correct plays / time / skipped', () => {
        const d = computeEntityDetail(data, resolver, { type: 'song', name: 'Hello', artist: 'Adele' });
        expect(d.plays).toBe(2);
        expect(d.time).toBe(300000);
        expect(d.missedTime).toBe(290000); // (295-200) + (295-100) k
        expect(d.years.map((y) => y.label)).toEqual(['2021', '2022']);
        expect(d.years[0].plays).toBe(1);
        expect(d.months.length).toBe(12);
        expect(d.dows.length).toBe(7);
        expect(d.hours.length).toBe(24);
        expect(Object.keys(d.dates)).toEqual(['2021-03-10', '2022-06-20']);
        expect(d.first.getUTCFullYear()).toBe(2021);
        expect(d.last.getUTCFullYear()).toBe(2022);
    });

    test('artist entity matches all that artist\'s songs', () => {
        const d = computeEntityDetail(data, resolver, { type: 'artist', artist: 'Adele' });
        expect(d.plays).toBe(2); // both Hello plays
    });

    test('album entity matches by native album name', () => {
        const d = computeEntityDetail(data, resolver, { type: 'album', album: '25' });
        expect(d.plays).toBe(2);
        const other = computeEntityDetail(data, resolver, { type: 'album', album: 'X' });
        expect(other.plays).toBe(1);
    });
});

describe('detail.searchItems', () => {
    test('searches across songs, artists and albums', () => {
        const results = {
            songs: [{ key: "'Hello' by Adele", value: { name: 'Hello', artist: 'Adele', plays: 5, time: 1000 } }],
            artists: [{ key: 'Adele', value: { plays: 5, time: 1000 } }],
            albums: [{ key: '25', value: { plays: 5, time: 1000 } }]
        };
        const items = buildSearchItems(results);
        expect(searchItems(items, 'hel').some((i) => i.type === 'song' && i.name === 'Hello')).toBe(true);
        expect(searchItems(items, 'adele').some((i) => i.type === 'artist')).toBe(true);
        expect(searchItems(items, '25').some((i) => i.type === 'album')).toBe(true);
        expect(searchItems(items, '')).toEqual([]);
    });
});
