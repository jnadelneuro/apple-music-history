import TrackMatcher from './TrackMatcher';
import Computation from './Computation';

describe('TrackMatcher Integration Tests', () => {
    describe('Integration with real-world-like data', () => {
        it('should match play activity with library and flag duplicates', () => {
            // Simulated Apple Music Play Activity data
            const playActivity = [
                {
                    'Song Name': 'Bohemian Rhapsody',
                    'Artist Name': 'Queen',
                    'Play Duration Milliseconds': '354000',
                    'Media Duration In Milliseconds': '354000',
                    'Event End Timestamp': '2023-01-15T10:30:00Z',
                    'UTC Offset In Seconds': '0'
                },
                {
                    'Song Name': 'Let It Be',
                    'Artist Name': 'The Beatles',
                    'Play Duration Milliseconds': '243000',
                    'Media Duration In Milliseconds': '243000',
                    'Event End Timestamp': '2023-01-15T11:00:00Z',
                    'UTC Offset In Seconds': '0'
                },
                {
                    'Song Name': 'Let It Be',
                    'Artist Name': 'The Beatles',
                    'Play Duration Milliseconds': '243000',
                    'Media Duration In Milliseconds': '243000',
                    'Event End Timestamp': '2023-01-15T12:00:00Z',
                    'UTC Offset In Seconds': '0'
                },
                {
                    'Song Name': 'Unknown Song',
                    'Artist Name': 'Unknown Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T13:00:00Z',
                    'UTC Offset In Seconds': '0'
                }
            ];

            // Simulated Apple Music Library data
            // "Let It Be" has 2 versions (original and remaster)
            const libraryTracks = [
                {
                    'Song Name': 'Bohemian Rhapsody',
                    'Artist': 'Queen',
                    'Album': 'A Night at the Opera'
                },
                {
                    'Song Name': 'Let It Be',
                    'Artist': 'The Beatles',
                    'Album': 'Let It Be'
                },
                {
                    'Song Name': 'Let It Be',
                    'Artist': 'The Beatles',
                    'Album': 'Let It Be (2021 Remaster)'
                }
            ];

            const results = TrackMatcher.matchPlayActivity(playActivity, libraryTracks);

            // Verify statistics
            expect(results.statistics.totalPlays).toBe(4);
            expect(results.statistics.matched).toBe(3); // Bohemian Rhapsody + 2x Let It Be
            expect(results.statistics.unmatched).toBe(1); // Unknown Song
            expect(results.statistics.uncertain).toBe(2); // 2 plays of "Let It Be" (has 2 library versions)

            // Verify uncertain songs are tracked
            expect(results.uncertainSongs).toContain('Let It Be');
            expect(results.uncertainSongs).not.toContain('Bohemian Rhapsody');
            expect(results.statistics.uniqueSongsUncertain).toBe(1);
        });

        it('should not flag as uncertain when only 1 library version exists', () => {
            const playActivity = [
                {
                    'Song Name': 'Unique Song',
                    'Artist Name': 'Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0'
                }
            ];

            const libraryTracks = [
                { 'Song Name': 'Unique Song', 'Artist': 'Artist' }
            ];

            const results = TrackMatcher.matchPlayActivity(playActivity, libraryTracks);

            expect(results.statistics.matched).toBe(1);
            expect(results.statistics.uncertain).toBe(0);
            expect(results.uncertainSongs.length).toBe(0);
        });

        it('should work with Computation.calculateTop when library data is provided', (done) => {
            const playActivity = [
                {
                    'Song Name': 'Test Song',
                    'Artist Name': 'Test Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0',
                    'Item Type': 'AUDIO',
                    'End Reason Type': 'NATURAL_END_OF_TRACK'
                }
            ];

            const libraryTracks = [
                { 'Song Name': 'Test Song' },
                { 'Song Name': 'Test Song' }
            ];

            Computation.calculateTop(playActivity, [], (results) => {
                // With library data
                expect(results.matchResults).toBeDefined();
                expect(results.matchResults.statistics.uncertain).toBe(1);
                done();
            }, libraryTracks);
        });

        it('should work with Computation.calculateTop without library data', (done) => {
            const playActivity = [
                {
                    'Song Name': 'Test Song',
                    'Artist Name': 'Test Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0',
                    'Item Type': 'AUDIO',
                    'End Reason Type': 'NATURAL_END_OF_TRACK'
                }
            ];

            Computation.calculateTop(playActivity, [], (results) => {
                // Without library data
                expect(results.matchResults).toBeNull();
                done();
            });
        });

        it('should handle case-insensitive matching with whitespace variations', () => {
            const playActivity = [
                {
                    'Song Name': '  HELLO  WORLD  ',
                    'Artist Name': 'Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0'
                }
            ];

            const libraryTracks = [
                { 'Song Name': 'hello world' },
                { 'Song Name': 'Hello World' }
            ];

            const results = TrackMatcher.matchPlayActivity(playActivity, libraryTracks);

            expect(results.statistics.matched).toBe(1);
            expect(results.statistics.uncertain).toBe(1); // 2 versions in library
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle plays with empty song names', () => {
            const playActivity = [
                {
                    'Song Name': '',
                    'Artist Name': 'Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0'
                },
                {
                    'Song Name': 'Valid Song',
                    'Artist Name': 'Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0'
                }
            ];

            const libraryTracks = [
                { 'Song Name': 'Valid Song' }
            ];

            const results = TrackMatcher.matchPlayActivity(playActivity, libraryTracks);

            expect(results.statistics.totalPlays).toBe(1); // Only valid song counted
            expect(results.statistics.matched).toBe(1);
        });

        it('should handle library with empty song names', () => {
            const playActivity = [
                {
                    'Song Name': 'Test Song',
                    'Artist Name': 'Artist',
                    'Play Duration Milliseconds': '180000',
                    'Media Duration In Milliseconds': '180000',
                    'Event End Timestamp': '2023-01-15T10:00:00Z',
                    'UTC Offset In Seconds': '0'
                }
            ];

            const libraryTracks = [
                { 'Song Name': '' },
                { 'Song Name': 'Test Song' },
                { 'Song Name': null }
            ];

            const results = TrackMatcher.matchPlayActivity(playActivity, libraryTracks);

            expect(results.statistics.matched).toBe(1);
            expect(results.statistics.uncertain).toBe(0); // Only 1 valid library entry
        });

        it('should handle empty arrays gracefully', () => {
            expect(() => {
                TrackMatcher.matchPlayActivity([], []);
            }).not.toThrow();

            const results = TrackMatcher.matchPlayActivity([], []);
            expect(results.statistics.totalPlays).toBe(0);
        });

        it('should handle null/undefined inputs gracefully', () => {
            expect(() => {
                TrackMatcher.matchPlayActivity(null, null);
            }).not.toThrow();

            expect(() => {
                TrackMatcher.matchPlayActivity(undefined, undefined);
            }).not.toThrow();
        });
    });
});
