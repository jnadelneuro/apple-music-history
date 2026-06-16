/**
 * LibraryIndex - Maps Apple Music catalog Track Identifiers to library metadata.
 *
 * Replaces the old name-based TrackMatcher. The play-history files
 * ("Apple Music - Play History Daily Tracks.csv") already carry artist + title
 * in their "Track Description" field, so the library is only needed to recover
 * the one thing the play history lacks: the album.
 *
 * Each played row has a numeric "Track Identifier" (an Apple catalog id). The
 * library JSON stores that same catalog id under several fields, so we index a
 * track under every catalog-id field it exposes and look plays up by exact id.
 * This is deterministic: it disambiguates same-titled songs and same-named
 * songs that appear on multiple albums (e.g. a single vs. the album cut) — cases
 * that string matching fundamentally cannot resolve.
 */

class LibraryIndex {
    // Catalog-id fields in the library that correspond to a play's "Track Identifier".
    // The library's own local "Track Identifier" is a small sequential number and is
    // intentionally excluded to avoid spurious collisions with catalog ids.
    static CATALOG_ID_FIELDS = [
        'Apple Music Track Identifier',
        'Purchased Track Identifier',
        'Audio Matched Track Identifier',
        'Tag Matched Track Identifier'
    ];

    /**
     * Builds an id -> { album, duration } index from the library tracks.
     * @param {Array} libraryTracks - parsed "Apple Music Library Tracks.json"
     * @returns {Object} map of catalog-id string -> metadata
     */
    static build(libraryTracks) {
        const index = {};
        if (!Array.isArray(libraryTracks)) return index;

        for (const track of libraryTracks) {
            const album = track['Album'] || track['Album Name'] || track['album'] || null;
            const duration = Number(track['Track Duration']) || 0;
            const entry = { album, duration };

            for (const field of LibraryIndex.CATALOG_ID_FIELDS) {
                const id = track[field];
                if (id === undefined || id === null || id === '' || String(id) === '0') {
                    continue;
                }
                const key = String(id);
                // First writer wins; keep the entry that actually carries an album.
                if (!index[key] || (!index[key].album && album)) {
                    index[key] = entry;
                }
            }
        }

        return index;
    }

    /**
     * Looks up a played track's metadata by its catalog Track Identifier.
     * @returns {{album: (string|null), duration: number} | null}
     */
    static lookup(index, trackIdentifier) {
        if (!index || trackIdentifier === undefined || trackIdentifier === null || trackIdentifier === '') {
            return null;
        }
        return index[String(trackIdentifier)] || null;
    }
}

export default LibraryIndex;
