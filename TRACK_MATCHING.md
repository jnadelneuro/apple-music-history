# Track Matching Feature

## Overview

The Apple Music History analyzer now includes a **Track Matching** feature that can match your play activity records to your Apple Music library tracks. This helps identify when you've played songs that exist in multiple versions in your library (e.g., original vs. remastered versions, different editions, or live recordings).

## How It Works

### Matching Logic

1. **Song Name Matching**: Matches plays to library tracks using **song name only**
   - Case-insensitive (e.g., "Hello World" matches "hello world")
   - Whitespace normalized (e.g., "Hello  World" matches "Hello World")
   
2. **Duplicate Detection**: Identifies when a song name appears **2 or more times** in your library
   - Flags these matches as "uncertain" since it's unclear which library version was played
   - Tracks uncertainty statistics separately

3. **Match Statistics**: Provides detailed information about:
   - Total plays matched to library
   - Number of uncertain matches (songs with 2+ library versions)
   - Unmatched plays
   - Unique songs with multiple library versions

## Usage

### Basic Integration

The Track Matching functionality is integrated into the existing `Computation.calculateTop()` method:

```javascript
import Computation from './components/Computation';

// With library data (enables matching)
Computation.calculateTop(
  playActivityData,      // Your CSV play activity data
  excludedSongs,         // Songs to exclude from analysis
  (results) => {
    // results.matchResults contains matching statistics
    if (results.matchResults) {
      console.log('Match statistics:', results.matchResults.statistics);
      console.log('Uncertain songs:', results.matchResults.uncertainSongs);
    }
  },
  libraryTracks          // Optional: Your Apple Music library JSON data
);

// Without library data (no matching)
Computation.calculateTop(
  playActivityData,
  excludedSongs,
  (results) => {
    // results.matchResults will be null
  }
);
```

### Using TrackMatcher Directly

You can also use the TrackMatcher utility directly for custom analysis:

```javascript
import TrackMatcher from './components/TrackMatcher';

// Match play activity to library
const results = TrackMatcher.matchPlayActivity(playData, libraryTracks);

// Access statistics
console.log('Total plays:', results.statistics.totalPlays);
console.log('Matched plays:', results.statistics.matched);
console.log('Uncertain plays:', results.statistics.uncertain);
console.log('Unmatched plays:', results.statistics.unmatched);

// Get list of songs with multiple library versions
console.log('Uncertain songs:', results.uncertainSongs);
```

## Data Format

### Play Activity Data (CSV)

Your Apple Music Play Activity CSV should include these columns:
- `Song Name` (required)
- `Artist Name`
- `Play Duration Milliseconds`
- `Media Duration In Milliseconds`
- `Event End Timestamp`
- `UTC Offset In Seconds`

### Library Data (JSON)

Your Apple Music Library JSON should be an array of track objects with at least:
- `Song Name` (required) or `Name` or `name`

Other fields are optional and preserved but not used for matching.

## Examples

### Example 1: Single Library Version (No Uncertainty)

**Library:**
```json
[
  { "Song Name": "Bohemian Rhapsody", "Artist": "Queen" }
]
```

**Play Activity:**
```json
[
  { "Song Name": "Bohemian Rhapsody", "Artist Name": "Queen", ... }
]
```

**Result:** Matched, not uncertain (only 1 library version)

### Example 2: Multiple Library Versions (Uncertain Match)

**Library:**
```json
[
  { "Song Name": "Let It Be", "Artist": "The Beatles", "Album": "Let It Be" },
  { "Song Name": "Let It Be", "Artist": "The Beatles", "Album": "Let It Be (2021 Remaster)" }
]
```

**Play Activity:**
```json
[
  { "Song Name": "Let It Be", "Artist Name": "The Beatles", ... }
]
```

**Result:** Matched, but **uncertain** (2 library versions exist)

### Example 3: Case-Insensitive Matching

**Library:**
```json
[
  { "Song Name": "hello world" }
]
```

**Play Activity:**
```json
[
  { "Song Name": "HELLO  WORLD" }
]
```

**Result:** Matched (case-insensitive and whitespace normalized)

## UI Display

When uncertain matches are detected, the Results page displays a warning box:

```
⚠️ Library Match Information

X plays matched songs with multiple versions in your library.
These matches may be uncertain as the same song name appears 2 or more times in your library.

Songs with multiple library versions:
• Let It Be
• Imagine
• ...
```

## API Reference

### TrackMatcher Class

#### Methods

##### `normalizeSongName(songName)`
Normalizes a song name for matching (lowercase, trimmed, whitespace normalized).

**Parameters:**
- `songName` (string): The song name to normalize

**Returns:** Normalized string

##### `buildLibraryIndex(libraryTracks)`
Builds an index from library tracks for efficient matching.

**Parameters:**
- `libraryTracks` (Array): Array of library track objects

**Returns:** Index object with normalized song names as keys

##### `matchPlay(songName, libraryIndex)`
Matches a single play to library tracks.

**Parameters:**
- `songName` (string): Song name from play activity
- `libraryIndex` (Object): Pre-built library index

**Returns:** Match result object with:
- `matched` (boolean): Whether a match was found
- `uncertain` (boolean): Whether match is uncertain (2+ library versions)
- `count` (number): Number of library versions found
- `tracks` (Array): Array of matched library tracks

##### `matchPlayActivity(playData, libraryTracks)`
Processes entire play activity dataset.

**Parameters:**
- `playData` (Array): Array of play activity records
- `libraryTracks` (Array): Array of library track objects

**Returns:** Results object with:
- `statistics` (Object): Match statistics
  - `totalPlays`: Total plays processed
  - `matched`: Number of matched plays
  - `unmatched`: Number of unmatched plays
  - `uncertain`: Number of uncertain matches (2+ library versions)
  - `uniqueSongsPlayed`: Number of unique songs played
  - `uniqueSongsMatched`: Number of unique songs matched
  - `uniqueSongsUncertain`: Number of unique songs with uncertain matches
- `playMatches` (Array): Detailed match results for each play
- `uncertainSongs` (Array): List of song names with multiple library versions

## Technical Details

### Why Song Name Only?

The matching uses **song name only** (not artist name) because:
1. Play activity and library data may have different artist formatting
2. Features/remixes often have different artists but same song name
3. Simplifies the matching logic while still being effective

### Uncertainty Threshold

A match is flagged as "uncertain" when:
- The song name appears **2 or more times** in the library
- This indicates different versions/editions of the same song

### Performance

- Library indexing: O(n) where n = library size
- Matching per play: O(1) average case (hash table lookup)
- Overall matching: O(m + n) where m = plays, n = library size

## Limitations

1. **Song Name Only**: Does not consider artist name in matching
2. **No Fuzzy Matching**: Requires exact match after normalization
3. **No Album Information**: Does not use album data for disambiguation
4. **Library Required**: Matching only works when library data is provided

## Future Enhancements

Potential improvements for future versions:
- Optional artist name matching for disambiguation
- Fuzzy matching for typos/variations
- Album-based matching
- Confidence scores for uncertain matches
- Manual match correction interface
