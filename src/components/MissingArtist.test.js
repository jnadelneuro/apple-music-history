/**
 * Integration tests for handling CSV data with missing artist names
 * Tests the new functionality where artist names are enriched from library data
 */

import Computation from './Computation';

describe('Missing Artist Name Handling', () => {
    test('should handle play data without artist names using library', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "", // Missing artist name
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "Library Artist"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should use artist from library
            expect(results.artists[0].key).toBe('Library Artist');
            expect(results.songs[0].key).toBe("'Test Song' by Library Artist");
            
            done();
        }, libraryData);
    });

    test('should handle play data without artist names and no library', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "", // Missing artist name
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should use "Unknown Artist" fallback
            expect(results.artists[0].key).toBe('Unknown Artist');
            expect(results.songs[0].key).toBe("'Test Song' by Unknown Artist");
            
            done();
        }, null);
    });

    test('should prefer artist name from CSV over library', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "CSV Artist", // Has artist name
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "Library Artist"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should use CSV artist, not library
            expect(results.artists[0].key).toBe('CSV Artist');
            expect(results.songs[0].key).toBe("'Test Song' by CSV Artist");
            
            done();
        }, libraryData);
    });

    test('should handle missing artist name field entirely', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                // No Artist Name field at all
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Test Song",
                "Artist": "Library Artist" // Different field name
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should find artist from library
            expect(results.artists[0].key).toBe('Library Artist');
            
            done();
        }, libraryData);
    });

    test('should handle multiple plays with mixed artist data', (done) => {
        const playData = [
            {
                "Song Name": "Song With Artist",
                "Artist Name": "Known Artist",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            },
            {
                "Song Name": "Song Without Artist",
                "Artist Name": "",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T15:30:00Z",
                "Event Start Timestamp": "2023-01-15T15:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Song Without Artist",
                "Artist Name": "Library Artist"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBe(2);
            expect(results.artists.length).toBe(2);
            
            // Check both artists are present
            const artistNames = results.artists.map(a => a.key).sort();
            expect(artistNames).toContain('Known Artist');
            expect(artistNames).toContain('Library Artist');
            
            done();
        }, libraryData);
    });

    test('should handle case-insensitive song name matching', (done) => {
        const playData = [
            {
                "Song Name": "TEST SONG",
                "Artist Name": "",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "test song",
                "Artist Name": "Library Artist"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            
            // Should match despite case difference
            expect(results.artists[0].key).toBe('Library Artist');
            
            done();
        }, libraryData);
    });

    test('should handle "Artist" column name (without "Name")', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Artist": "Artist from CSV", // Using "Artist" instead of "Artist Name"
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should use "Artist" column
            expect(results.artists[0].key).toBe('Artist from CSV');
            expect(results.songs[0].key).toBe("'Test Song' by Artist from CSV");
            
            done();
        }, null);
    });

    test('should handle "Container Artist Name" column', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Container Artist Name": "Container Artist", // Using container metadata
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should use "Container Artist Name" column
            expect(results.artists[0].key).toBe('Container Artist');
            expect(results.songs[0].key).toBe("'Test Song' by Container Artist");
            
            done();
        }, null);
    });

    test('should prioritize "Artist Name" over "Container Artist Name"', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                "Artist Name": "Primary Artist",
                "Container Artist Name": "Container Artist",
                "Play Duration Milliseconds": "180000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:27:00Z",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBeGreaterThan(0);
            expect(results.artists.length).toBeGreaterThan(0);
            
            // Should prefer "Artist Name" over "Container Artist Name"
            expect(results.artists[0].key).toBe('Primary Artist');
            expect(results.songs[0].key).toBe("'Test Song' by Primary Artist");
            
            done();
        }, null);
    });
});
