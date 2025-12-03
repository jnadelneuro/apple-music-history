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

    test('should use artist name from library only (CSV has no artist info)', (done) => {
        const playData = [
            {
                "Song Name": "Test Song",
                // CSV has NO artist information
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
            
            // Should use library artist since CSV has no artist info
            expect(results.artists[0].key).toBe('Library Artist');
            expect(results.songs[0].key).toBe("'Test Song' by Library Artist");
            
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

    test('should handle multiple plays with all artist data from library', (done) => {
        const playData = [
            {
                "Song Name": "Song One",
                // CSV has NO artist information
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
                "Song Name": "Song Two",
                // CSV has NO artist information
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
                "Song Name": "Song One",
                "Artist Name": "Artist One"
            },
            {
                "Song Name": "Song Two",
                "Artist Name": "Artist Two"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            expect(results.songs.length).toBe(2);
            expect(results.artists.length).toBe(2);
            
            // Check both artists are present from library
            const artistNames = results.artists.map(a => a.key).sort();
            expect(artistNames).toContain('Artist One');
            expect(artistNames).toContain('Artist Two');
            
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



    test('should correctly detect paused plays without CSV artist data', (done) => {
        // Test that isSamePlay works by song name when CSV has no artist info
        const playData = [
            {
                "Song Name": "Paused Song",
                // CSV has NO artist information
                "Play Duration Milliseconds": "90000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:30:00Z",
                "Event Start Timestamp": "2023-01-15T14:28:30Z",
                "Start Position In Milliseconds": "0",
                "End Position In Milliseconds": "90000",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "PLAYBACK_MANUALLY_PAUSED",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            },
            {
                "Song Name": "Paused Song",
                // CSV has NO artist information
                "Play Duration Milliseconds": "110000",
                "Media Duration In Milliseconds": "200000",
                "Event End Timestamp": "2023-01-15T14:32:00Z",
                "Event Start Timestamp": "2023-01-15T14:30:10Z",
                "Start Position In Milliseconds": "90000",
                "End Position In Milliseconds": "200000",
                "UTC Offset In Seconds": "0",
                "End Reason Type": "NATURAL_END_OF_TRACK",
                "Item Type": "SONG",
                "Media Type": "AUDIO"
            }
        ];

        const libraryData = [
            {
                "Song Name": "Paused Song",
                "Artist Name": "Test Artist"
            }
        ];

        Computation.calculateTop(playData, [], (results) => {
            // Should count as 1 play (paused and resumed), not 2
            expect(results.songs.length).toBe(1);
            expect(results.songs[0].value.plays).toBe(1);
            expect(results.songs[0].key).toBe("'Paused Song' by Test Artist");
            
            done();
        }, libraryData);
    });
});
