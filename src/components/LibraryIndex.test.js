import LibraryIndex from './LibraryIndex';

describe('LibraryIndex', () => {
    test('indexes a track under every catalog-id field it exposes', () => {
        const lib = [
            {
                Title: 'Bohemian Rhapsody',
                Artist: 'Queen',
                Album: 'A Night at the Opera',
                'Track Duration': 354000,
                'Apple Music Track Identifier': '1000',
                'Purchased Track Identifier': '2000'
            }
        ];
        const index = LibraryIndex.build(lib);

        expect(LibraryIndex.lookup(index, '1000').album).toBe('A Night at the Opera');
        expect(LibraryIndex.lookup(index, '2000').album).toBe('A Night at the Opera');
        expect(LibraryIndex.lookup(index, 1000).duration).toBe(354000);
    });

    test('ignores empty / zero / missing id values', () => {
        const index = LibraryIndex.build([
            { Title: 'X', Album: 'A', 'Apple Music Track Identifier': '0', 'Purchased Track Identifier': '' }
        ]);
        expect(LibraryIndex.lookup(index, '0')).toBeNull();
        expect(LibraryIndex.lookup(index, '')).toBeNull();
        expect(LibraryIndex.lookup(index, null)).toBeNull();
    });

    test('disambiguates the same title on different albums by id', () => {
        // Same song title, two different releases -> two different ids/albums.
        const lib = [
            { Title: 'Halo', Album: 'I AM...SASHA FIERCE', 'Apple Music Track Identifier': '11' },
            { Title: 'Halo', Album: 'Hope for Haiti Now', 'Apple Music Track Identifier': '22' }
        ];
        const index = LibraryIndex.build(lib);

        expect(LibraryIndex.lookup(index, '11').album).toBe('I AM...SASHA FIERCE');
        expect(LibraryIndex.lookup(index, '22').album).toBe('Hope for Haiti Now');
    });

    test('returns empty index for non-array input', () => {
        expect(LibraryIndex.build(null)).toEqual({});
        expect(LibraryIndex.build(undefined)).toEqual({});
    });
});
