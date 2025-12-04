import Computation from './Computation';

describe('Year Albums Calculation', () => {
    test('should calculate top albums per year', (done) => {
        const playData = [
            {
                "Song Name": "Song 1",
                "Album Name": "Album A",
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
                "Album Name": "Album B",
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
                "Album Name": "Album A",
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
            // Check that albums is present
            expect(results.albums).toBeDefined();
            expect(results.albums.length).toBeGreaterThan(0);
            
            // Check that yearAlbums is present
            expect(results.yearAlbums).toBeDefined();
            expect(results.yearAlbums.length).toBeGreaterThan(0);
            
            // Check that we have data for 2022 and 2023
            const years = results.yearAlbums.map(y => y.key);
            expect(years).toContain('2022');
            expect(years).toContain('2023');
            
            // Find 2022 data
            const year2022 = results.yearAlbums.find(y => y.key === '2022');
            expect(year2022).toBeDefined();
            expect(year2022.value).toBeDefined();
            expect(year2022.value.length).toBeGreaterThan(0);
            
            // Check that albums are sorted by time
            if (year2022.value.length > 1) {
                for (let i = 0; i < year2022.value.length - 1; i++) {
                    expect(year2022.value[i].value.time).toBeGreaterThanOrEqual(year2022.value[i + 1].value.time);
                }
            }
            
            // Find 2023 data
            const year2023 = results.yearAlbums.find(y => y.key === '2023');
            expect(year2023).toBeDefined();
            expect(year2023.value).toBeDefined();
            
            // Verify Album A appears in both years
            const album2022A = year2022.value.find(a => a.key === 'Album A');
            const album2023A = year2023.value.find(a => a.key === 'Album A');
            expect(album2022A).toBeDefined();
            expect(album2023A).toBeDefined();
            
            // Check all-time albums
            const allTimeAlbums = results.albums;
            expect(allTimeAlbums.length).toBeGreaterThan(0);
            
            // Album A should be on top with more total time
            const albumA = allTimeAlbums.find(a => a.key === 'Album A');
            expect(albumA).toBeDefined();
            expect(albumA.value.time).toBe(330000); // 180000 + 150000
            
            done();
        }, libraryData);
    });

    test('should exclude albums from excluded songs', (done) => {
        const playData = [
            {
                "Song Name": "Song 1",
                "Album Name": "Album A",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2022-01-15T14:30:00Z",
                "Event Start Timestamp": "2022-01-15T14:27:00Z",
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
            }
        ];

        Computation.calculateTop(playData, ["'Song 1' by Artist A"], (results) => {
            // Albums should still be tracked even if the song is excluded
            // This is because albums tracking happens within the excluded songs check
            expect(results.albums).toBeDefined();
            
            // But since the song is excluded, album should not be counted
            const albumA = results.albums.find(a => a.key === 'Album A');
            expect(albumA).toBeUndefined();
            
            done();
        }, libraryData);
    });
});
