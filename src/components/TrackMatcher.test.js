import TrackMatcher from './TrackMatcher';

describe('TrackMatcher', () => {
    describe('normalizeSongName', () => {
        it('should normalize song names to lowercase', () => {
            expect(TrackMatcher.normalizeSongName('Hello World')).toBe('hello world');
            expect(TrackMatcher.normalizeSongName('HELLO WORLD')).toBe('hello world');
        });

        it('should trim whitespace', () => {
            expect(TrackMatcher.normalizeSongName('  Hello World  ')).toBe('hello world');
            expect(TrackMatcher.normalizeSongName('\tHello World\n')).toBe('hello world');
        });

        it('should normalize internal whitespace', () => {
            expect(TrackMatcher.normalizeSongName('Hello  World')).toBe('hello world');
            expect(TrackMatcher.normalizeSongName('Hello   \t  World')).toBe('hello world');
        });

        it('should handle empty or invalid inputs', () => {
            expect(TrackMatcher.normalizeSongName('')).toBe('');
            expect(TrackMatcher.normalizeSongName(null)).toBe('');
            expect(TrackMatcher.normalizeSongName(undefined)).toBe('');
            expect(TrackMatcher.normalizeSongName(123)).toBe('');
        });
    });

    describe('buildLibraryIndex', () => {
        it('should build an index from library tracks', () => {
            const libraryTracks = [
                { 'Song Name': 'Hello' },
                { 'Song Name': 'World' }
            ];

            const index = TrackMatcher.buildLibraryIndex(libraryTracks);

            expect(index['hello']).toBeDefined();
            expect(index['hello'].count).toBe(1);
            expect(index['world']).toBeDefined();
            expect(index['world'].count).toBe(1);
        });

        it('should detect duplicate song names (2 or more instances)', () => {
            const libraryTracks = [
                { 'Song Name': 'Hello' },
                { 'Song Name': 'Hello' },
                { 'Song Name': 'Hello' }
            ];

            const index = TrackMatcher.buildLibraryIndex(libraryTracks);

            expect(index['hello']).toBeDefined();
            expect(index['hello'].count).toBe(3);
            expect(index['hello'].tracks.length).toBe(3);
        });

        it('should handle case-insensitive duplicates', () => {
            const libraryTracks = [
                { 'Song Name': 'Hello' },
                { 'Song Name': 'HELLO' },
                { 'Song Name': 'hello' }
            ];

            const index = TrackMatcher.buildLibraryIndex(libraryTracks);

            expect(index['hello']).toBeDefined();
            expect(index['hello'].count).toBe(3);
        });

        it('should skip tracks with missing or empty song names', () => {
            const libraryTracks = [
                { 'Song Name': 'Hello' },
                { 'Song Name': '' },
                { 'Song Name': null },
                { },
                { 'Song Name': 'World' }
            ];

            const index = TrackMatcher.buildLibraryIndex(libraryTracks);

            expect(index['hello']).toBeDefined();
            expect(index['world']).toBeDefined();
            expect(Object.keys(index).length).toBe(2);
        });

        it('should handle empty or invalid library arrays', () => {
            expect(TrackMatcher.buildLibraryIndex([])).toEqual({});
            expect(TrackMatcher.buildLibraryIndex(null)).toEqual({});
            expect(TrackMatcher.buildLibraryIndex(undefined)).toEqual({});
        });
    });

    describe('matchPlay', () => {
        let libraryIndex;

        beforeEach(() => {
            const libraryTracks = [
                { 'Song Name': 'Unique Song' },
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Duplicate Song' }
            ];
            libraryIndex = TrackMatcher.buildLibraryIndex(libraryTracks);
        });

        it('should match a play to a library track', () => {
            const result = TrackMatcher.matchPlay('Unique Song', libraryIndex);

            expect(result.matched).toBe(true);
            expect(result.count).toBe(1);
            expect(result.uncertain).toBe(false);
        });

        it('should flag matches as uncertain when 2 or more instances exist', () => {
            const result = TrackMatcher.matchPlay('Duplicate Song', libraryIndex);

            expect(result.matched).toBe(true);
            expect(result.count).toBe(2);
            expect(result.uncertain).toBe(true);
        });

        it('should not flag as uncertain when only 1 instance exists', () => {
            const result = TrackMatcher.matchPlay('Unique Song', libraryIndex);

            expect(result.matched).toBe(true);
            expect(result.count).toBe(1);
            expect(result.uncertain).toBe(false);
        });

        it('should handle case-insensitive matching', () => {
            const result = TrackMatcher.matchPlay('UNIQUE SONG', libraryIndex);

            expect(result.matched).toBe(true);
            expect(result.count).toBe(1);
        });

        it('should return unmatched for songs not in library', () => {
            const result = TrackMatcher.matchPlay('Unknown Song', libraryIndex);

            expect(result.matched).toBe(false);
            expect(result.uncertain).toBe(false);
            expect(result.count).toBe(0);
        });

        it('should handle empty or invalid song names', () => {
            expect(TrackMatcher.matchPlay('', libraryIndex).matched).toBe(false);
            expect(TrackMatcher.matchPlay(null, libraryIndex).matched).toBe(false);
            expect(TrackMatcher.matchPlay(undefined, libraryIndex).matched).toBe(false);
        });
    });

    describe('matchPlayActivity', () => {
        it('should process play activity and return statistics', () => {
            const playData = [
                { 'Song Name': 'Unique Song' },
                { 'Song Name': 'Unique Song' },
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Unknown Song' }
            ];

            const libraryTracks = [
                { 'Song Name': 'Unique Song' },
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Duplicate Song' }
            ];

            const results = TrackMatcher.matchPlayActivity(playData, libraryTracks);

            expect(results.statistics.totalPlays).toBe(4);
            expect(results.statistics.matched).toBe(3);
            expect(results.statistics.unmatched).toBe(1);
            expect(results.statistics.uncertain).toBe(1); // Only the duplicate song play
        });

        it('should track unique songs correctly', () => {
            const playData = [
                { 'Song Name': 'Song A' },
                { 'Song Name': 'Song A' },
                { 'Song Name': 'Song B' }
            ];

            const libraryTracks = [
                { 'Song Name': 'Song A' },
                { 'Song Name': 'Song B' }
            ];

            const results = TrackMatcher.matchPlayActivity(playData, libraryTracks);

            expect(results.statistics.uniqueSongsPlayed).toBe(2);
            expect(results.statistics.uniqueSongsMatched).toBe(2);
        });

        it('should handle empty play data', () => {
            const results = TrackMatcher.matchPlayActivity([], []);

            expect(results.statistics.totalPlays).toBe(0);
            expect(results.statistics.matched).toBe(0);
            expect(results.statistics.unmatched).toBe(0);
            expect(results.statistics.uncertain).toBe(0);
        });

        it('should skip plays with missing song names', () => {
            const playData = [
                { 'Song Name': 'Valid Song' },
                { 'Song Name': '' },
                { 'Song Name': null },
                { }
            ];

            const libraryTracks = [
                { 'Song Name': 'Valid Song' }
            ];

            const results = TrackMatcher.matchPlayActivity(playData, libraryTracks);

            expect(results.statistics.totalPlays).toBe(1);
            expect(results.statistics.matched).toBe(1);
        });

        it('should collect uncertain song names', () => {
            const playData = [
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Another Duplicate' }
            ];

            const libraryTracks = [
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Duplicate Song' },
                { 'Song Name': 'Another Duplicate' },
                { 'Song Name': 'Another Duplicate' }
            ];

            const results = TrackMatcher.matchPlayActivity(playData, libraryTracks);

            expect(results.uncertainSongs).toContain('Duplicate Song');
            expect(results.uncertainSongs).toContain('Another Duplicate');
            expect(results.statistics.uniqueSongsUncertain).toBe(2);
        });
    });
});
