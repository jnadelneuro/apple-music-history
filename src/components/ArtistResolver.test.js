import ArtistResolver from './ArtistResolver';

describe('ArtistResolver', () => {
    test('disambiguates same-titled songs by album', () => {
        const lib = [
            { Title: 'Hello', Album: '25', Artist: 'Adele' },
            { Title: 'Hello', Album: 'Thank Me Later', Artist: 'Drake' }
        ];
        const r = new ArtistResolver(lib, null);
        expect(r.resolve('Hello', '25')).toBe('Adele');
        expect(r.resolve('Hello', 'Thank Me Later')).toBe('Drake');
    });

    test('matches albums ignoring edition/format suffixes', () => {
        const r = new ArtistResolver([{ Title: 'Song', Album: 'Album', Artist: 'Artist' }], null);
        expect(r.resolve('Song', 'Album (Deluxe Version)')).toBe('Artist');
        expect(r.resolve('Song', 'Album - Single')).toBe('Artist');
    });

    test('falls back to a unique title when album does not match', () => {
        const r = new ArtistResolver([{ Title: 'Solo Hit', Album: 'X', Artist: 'OnlyOne' }], null);
        expect(r.resolve('Solo Hit', 'Some Other Album')).toBe('OnlyOne');
    });

    test('recovers artists from daily-tracks descriptions the library lacks', () => {
        const daily = [{ 'Track Description': 'Tyler, The Creator - Noid' }];
        const r = new ArtistResolver([], daily);
        expect(r.resolve('Noid', 'CHROMAKOPIA')).toBe('Tyler, The Creator');
    });

    test('uses most-played daily-tracks artist when a title is ambiguous', () => {
        const daily = [
            { 'Track Description': 'Artist A - Shared' },
            { 'Track Description': 'Artist A - Shared' },
            { 'Track Description': 'Artist B - Shared' }
        ];
        const lib = [
            { Title: 'Shared', Album: 'One', Artist: 'Artist A' },
            { Title: 'Shared', Album: 'Two', Artist: 'Artist B' }
        ];
        const r = new ArtistResolver(lib, daily);
        // Album "Three" isn't in the library, so it falls through to daily-tracks.
        expect(r.resolve('Shared', 'Three')).toBe('Artist A');
    });

    test('returns Unknown Artist when nothing matches', () => {
        const r = new ArtistResolver([{ Title: 'A', Album: 'B', Artist: 'C' }], null);
        expect(r.resolve('Nonexistent', 'Whatever')).toBe('Unknown Artist');
        expect(r.resolve('', '')).toBe('Unknown Artist');
    });

    test('works with no sources at all', () => {
        const r = new ArtistResolver(null, null);
        expect(r.resolve('Anything', 'Anywhere')).toBe('Unknown Artist');
    });
});
