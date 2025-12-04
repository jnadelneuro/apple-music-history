import Computation from './Computation';

describe('Year Artists Calculation', () => {
    test('should calculate top artists per year', (done) => {
        const playData = [
            {
                "Song Name": "Song 1",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2022-01-15T14:30:00Z",
                "Event Start Timestamp": "2022-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            },
            {
                "Song Name": "Song 2",
                "Play Duration Milliseconds": "200000",
                "Media Duration In Milliseconds": "220000",
                "Event End Timestamp": "2022-06-20T10:00:00Z",
                "Event Start Timestamp": "2022-06-20T09:57:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            },
            {
                "Song Name": "Song 3",
                "Play Duration Milliseconds": "150000",
                "Media Duration In Milliseconds": "180000",
                "Event End Timestamp": "2023-03-10T16:00:00Z",
                "Event Start Timestamp": "2023-03-10T15:57:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Song 1",
                "Artist Name": "Artist A"
            },
            {
                "Song Name": "Song 2",
                "Artist Name": "Artist B"
            },
            {
                "Song Name": "Song 3",
                "Artist Name": "Artist A"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            // Check that yearArtists is present
            expect(results.yearArtists).toBeDefined();
            expect(results.yearArtists.length).toBeGreaterThan(0);
            
            // Check that we have data for 2022 and 2023
            const years = results.yearArtists.map(y => y.key);
            expect(years).toContain('2022');
            expect(years).toContain('2023');
            
            // Find 2022 data
            const year2022 = results.yearArtists.find(y => y.key === '2022');
            expect(year2022).toBeDefined();
            expect(year2022.value).toBeDefined();
            expect(year2022.value.length).toBeGreaterThan(0);
            
            // Check that artists are sorted by time
            if (year2022.value.length > 1) {
                for (let i = 0; i < year2022.value.length - 1; i++) {
                    expect(year2022.value[i].value.time).toBeGreaterThanOrEqual(year2022.value[i + 1].value.time);
                }
            }
            
            // Find 2023 data
            const year2023 = results.yearArtists.find(y => y.key === '2023');
            expect(year2023).toBeDefined();
            expect(year2023.value).toBeDefined();
            expect(year2023.value.length).toBeGreaterThan(0);
            
            // Check that Artist A appears in 2023
            const artistsIn2023 = year2023.value.map(a => a.key);
            expect(artistsIn2023).toContain('Artist A');
            
            done();
        }, libraryData);
    });

    test('should handle multiple plays by same artist in same year', (done) => {
        const playData = [
            {
                "Song Name": "Song 1",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2022-01-15T14:30:00Z",
                "Event Start Timestamp": "2022-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            },
            {
                "Song Name": "Song 2",
                "Play Duration Milliseconds": "200000",
                "Media Duration In Milliseconds": "220000",
                "Event End Timestamp": "2022-06-20T10:00:00Z",
                "Event Start Timestamp": "2022-06-20T09:57:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Song 1",
                "Artist Name": "Artist A"
            },
            {
                "Song Name": "Song 2",
                "Artist Name": "Artist A"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.yearArtists).toBeDefined();
            
            const year2022 = results.yearArtists.find(y => y.key === '2022');
            expect(year2022).toBeDefined();
            
            // Should have only one artist (Artist A)
            expect(year2022.value.length).toBe(1);
            expect(year2022.value[0].key).toBe('Artist A');
            
            // Total time should be sum of both plays
            expect(year2022.value[0].value.time).toBe(380000);
            expect(year2022.value[0].value.plays).toBe(2);
            
            done();
        }, libraryData);
    });
});
