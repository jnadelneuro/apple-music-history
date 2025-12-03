/**
 * TrackMatcher - Utility for matching play activity records to library tracks
 * 
 * Matches plays to library tracks by song name and identifies uncertain matches
 * when duplicate song names exist in the library (2 or more instances).
 */

class TrackMatcher {
    /**
     * Normalizes a song name for matching
     * - Converts to lowercase
     * - Trims whitespace
     * - Normalizes internal whitespace
     * 
     * @param {string} songName - The song name to normalize
     * @returns {string} Normalized song name
     */
    static normalizeSongName(songName) {
        if (!songName || typeof songName !== 'string') {
            return '';
        }
        
        return songName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' '); // Normalize internal whitespace
    }

    /**
     * Builds a library index from the Apple Music Library JSON
     * Groups tracks by normalized song name and identifies duplicates
     * 
     * @param {Array} libraryTracks - Array of library track objects
     * @returns {Object} Index with song names as keys and track info as values
     */
    static buildLibraryIndex(libraryTracks) {
        const libraryIndex = {};

        if (!libraryTracks) return libraryIndex;

        libraryTracks.forEach(track => {
            // 1. Get the title and artist
            // (Adjust keys "Title"/"Song Name" based on your specific JSON format)
            const title = track["Title"] || track["Song Name"];
            
            if (title) {
                // 2. Create the standard normalized key
                const normalizedName = title.toLowerCase().trim().replace(/\s+/g, ' ');
                
                // Helper to add to index
                const addToIndex = (key) => {
                    if (!libraryIndex[key]) {
                        libraryIndex[key] = { tracks: [track] };
                    } else {
                        libraryIndex[key].tracks.push(track);
                    }
                };

                // Add the standard key
                addToIndex(normalizedName);

                // 3. EDGE CASE FIX: Add a version WITHOUT parentheses
                // If the title has parentheses, strip them and add that key too
                if (normalizedName.includes('(') && normalizedName.includes(')')) {
                    const strippedName = normalizedName.replace(/\s*\(.*?\)\s*/g, '').trim();
                    if (strippedName !== normalizedName && strippedName.length > 0) {
                        addToIndex(strippedName);
                    }
                }
            }
        });

        return libraryIndex;
    }
    /**
     * Matches a play record to library tracks
     * 
     * @param {string} songName - Song name from play activity
     * @param {Object} libraryIndex - Pre-built library index
     * @returns {Object} Match result with status and matched tracks
     */
    static matchPlay(songName, libraryIndex) {
        const normalizedName = this.normalizeSongName(songName);
        
        if (!normalizedName) {
            return {
                matched: false,
                uncertain: false,
                count: 0,
                tracks: []
            };
        }

        const libraryEntry = libraryIndex[normalizedName];

        if (!libraryEntry) {
            return {
                matched: false,
                uncertain: false,
                count: 0,
                tracks: []
            };
        }

        // Only flag as uncertain if there are 2 or more instances
        const isUncertain = libraryEntry.count >= 2;

        return {
            matched: true,
            uncertain: isUncertain,
            count: libraryEntry.count,
            tracks: libraryEntry.tracks
        };
    }

    /**
     * Processes play activity data and matches it against library tracks
     * 
     * @param {Array} playData - Array of play activity records
     * @param {Array} libraryTracks - Array of library track objects
     * @returns {Object} Match statistics and detailed results
     */
    static matchPlayActivity(playData, libraryTracks) {
        const libraryIndex = this.buildLibraryIndex(libraryTracks);
        const results = {
            statistics: {
                totalPlays: 0,
                matched: 0,
                unmatched: 0,
                uncertain: 0,
                uniqueSongsPlayed: 0,
                uniqueSongsMatched: 0,
                uniqueSongsUncertain: 0
            },
            playMatches: [],
            uncertainSongs: new Set()
        };

        if (!Array.isArray(playData)) {
            return results;
        }

        const processedSongs = new Set();
        const matchedSongs = new Set();
        const uncertainSongNames = new Set();

        for (const play of playData) {
            const songName = play['Song Name'];
            
            if (!songName || songName.length === 0) {
                continue;
            }

            results.statistics.totalPlays++;
            
            const normalizedName = this.normalizeSongName(songName);
            processedSongs.add(normalizedName);

            const matchResult = this.matchPlay(songName, libraryIndex);
            
            if (matchResult.matched) {
                results.statistics.matched++;
                matchedSongs.add(normalizedName);
                
                if (matchResult.uncertain) {
                    results.statistics.uncertain++;
                    uncertainSongNames.add(songName);
                }
            } else {
                results.statistics.unmatched++;
            }

            results.playMatches.push({
                play: play,
                matchResult: matchResult
            });
        }

        results.statistics.uniqueSongsPlayed = processedSongs.size;
        results.statistics.uniqueSongsMatched = matchedSongs.size;
        results.statistics.uniqueSongsUncertain = uncertainSongNames.size;
        results.uncertainSongs = Array.from(uncertainSongNames);

        return results;
    }

    /**
     * Gets summary statistics for display
     * 
     * @param {Object} matchResults - Results from matchPlayActivity
     * @returns {Object} Summary statistics
     */
    static getSummary(matchResults) {
        const stats = matchResults.statistics;
        
        return {
            totalPlays: stats.totalPlays,
            matchedPlays: stats.matched,
            unmatchedPlays: stats.unmatched,
            uncertainPlays: stats.uncertain,
            matchRate: stats.totalPlays > 0 
                ? ((stats.matched / stats.totalPlays) * 100).toFixed(1) 
                : 0,
            uncertainRate: stats.matched > 0
                ? ((stats.uncertain / stats.matched) * 100).toFixed(1)
                : 0,
            uniqueSongs: stats.uniqueSongsPlayed,
            uncertainSongs: matchResults.uncertainSongs
        };
    }
}

export default TrackMatcher;
