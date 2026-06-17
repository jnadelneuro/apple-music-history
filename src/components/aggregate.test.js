import { mergeYears, availableYears, yearSlice } from './aggregate';

const perYear = [
    { key: '2021', value: [
        { key: "'A' by X", value: { plays: 5, time: 1000, missedTime: 100, name: 'A', artist: 'X' } },
        { key: "'B' by Y", value: { plays: 2, time: 500, missedTime: 0, name: 'B', artist: 'Y' } }
    ] },
    { key: '2022', value: [
        { key: "'A' by X", value: { plays: 3, time: 2000, missedTime: 50, name: 'A', artist: 'X' } },
        { key: "'C' by Z", value: { plays: 10, time: 300, missedTime: 0, name: 'C', artist: 'Z' } }
    ] },
    { key: '2023', value: [
        { key: "'A' by X", value: { plays: 1, time: 100, missedTime: 0, name: 'A', artist: 'X' } }
    ] }
];

describe('aggregate.mergeYears', () => {
    test('sums entries across a non-consecutive year subset and sorts by time', () => {
        const merged = mergeYears(perYear, ['2021', '2023']); // skip 2022
        expect(merged.map((m) => m.key)).toEqual(["'A' by X", "'B' by Y"]); // C excluded (2022)
        const a = merged[0].value;
        expect(a.plays).toBe(6);   // 5 + 1
        expect(a.time).toBe(1100); // 1000 + 100
        expect(a.missedTime).toBe(100);
        expect(merged[0].value.name).toBe('A');
        expect(merged[0].value.artist).toBe('X');
    });

    test('returns empty when no years selected', () => {
        expect(mergeYears(perYear, [])).toEqual([]);
    });

    test('includes every year when all are selected', () => {
        const merged = mergeYears(perYear, ['2021', '2022', '2023']);
        const a = merged.find((m) => m.key === "'A' by X");
        expect(a.value.plays).toBe(9); // 5 + 3 + 1
    });
});

describe('aggregate.availableYears / yearSlice', () => {
    test('availableYears unions and sorts newest-first', () => {
        const results = { years: perYear, yearArtists: [{ key: '2019', value: [] }], yearAlbums: [] };
        expect(availableYears(results)).toEqual(['2023', '2022', '2021', '2019']);
    });

    test('yearSlice returns that year\'s list or empty', () => {
        expect(yearSlice(perYear, '2022').length).toBe(2);
        expect(yearSlice(perYear, '1999')).toEqual([]);
    });
});
