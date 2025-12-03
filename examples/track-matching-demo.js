/**
 * Track Matching Feature Demo
 * 
 * This script demonstrates how the track matching feature works with example data.
 * Run with: node examples/track-matching-demo.js
 */

// Note: This is a demo script showing the concept. 
// In the actual React app, you would load real CSV and JSON files.

const examplePlayActivity = [
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
        'Song Name': 'Imagine',
        'Artist Name': 'John Lennon',
        'Play Duration Milliseconds': '183000',
        'Media Duration In Milliseconds': '183000',
        'Event End Timestamp': '2023-01-15T13:00:00Z',
        'UTC Offset In Seconds': '0'
    },
    {
        'Song Name': 'Unknown Song',
        'Artist Name': 'Unknown Artist',
        'Play Duration Milliseconds': '180000',
        'Media Duration In Milliseconds': '180000',
        'Event End Timestamp': '2023-01-15T14:00:00Z',
        'UTC Offset In Seconds': '0'
    }
];

const exampleLibraryTracks = [
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
    },
    {
        'Song Name': 'Imagine',
        'Artist': 'John Lennon',
        'Album': 'Imagine'
    },
    {
        'Song Name': 'Imagine',
        'Artist': 'John Lennon',
        'Album': 'Imagine (Deluxe Edition)'
    },
    {
        'Song Name': 'Imagine',
        'Artist': 'John Lennon',
        'Album': 'Imagine (Live)'
    }
];

console.log('🎵 Track Matching Feature Demo\n');
console.log('═══════════════════════════════════════════════════\n');

console.log('📊 Example Data:');
console.log('  • Play Activity Records:', examplePlayActivity.length);
console.log('  • Library Tracks:', exampleLibraryTracks.length);
console.log('');

// Simulate the matching process (simplified for demo)
const songCounts = {};
exampleLibraryTracks.forEach(track => {
    const name = track['Song Name'].toLowerCase();
    songCounts[name] = (songCounts[name] || 0) + 1;
});

console.log('📚 Library Analysis:');
Object.entries(songCounts).forEach(([song, count]) => {
    const status = count >= 2 ? '⚠️ Multiple versions' : '✅ Single version';
    console.log(`  • ${song}: ${count} version(s) - ${status}`);
});
console.log('');

let matched = 0;
let unmatched = 0;
let uncertain = 0;
const uncertainSongs = new Set();

console.log('🔍 Matching Results:');
examplePlayActivity.forEach((play, idx) => {
    const songName = play['Song Name'];
    const normalizedName = songName.toLowerCase();
    const libraryCount = songCounts[normalizedName] || 0;
    
    if (libraryCount === 0) {
        console.log(`  ${idx + 1}. "${songName}" - ❌ Not in library`);
        unmatched++;
    } else if (libraryCount >= 2) {
        console.log(`  ${idx + 1}. "${songName}" - ⚠️ Matched (uncertain - ${libraryCount} versions in library)`);
        matched++;
        uncertain++;
        uncertainSongs.add(songName);
    } else {
        console.log(`  ${idx + 1}. "${songName}" - ✅ Matched (certain - 1 version in library)`);
        matched++;
    }
});
console.log('');

console.log('📈 Summary Statistics:');
console.log('  • Total Plays:', examplePlayActivity.length);
console.log('  • Matched Plays:', matched);
console.log('  • Unmatched Plays:', unmatched);
console.log('  • Uncertain Matches:', uncertain, `(${((uncertain / matched) * 100).toFixed(1)}% of matches)`);
console.log('');

if (uncertainSongs.size > 0) {
    console.log('⚠️  Warning: Library Match Uncertainty Detected');
    console.log('');
    console.log(`${uncertain} plays matched songs with multiple versions in your library.`);
    console.log('These matches may be uncertain as the same song name appears');
    console.log('2 or more times in your library.');
    console.log('');
    console.log('Songs with multiple library versions:');
    Array.from(uncertainSongs).forEach(song => {
        console.log(`  • ${song}`);
    });
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('💡 Key Features:');
console.log('  • Case-insensitive matching');
console.log('  • Whitespace normalization');
console.log('  • Flags uncertain matches (2+ library versions)');
console.log('  • Detailed statistics and reporting');
console.log('');
console.log('📖 For more details, see TRACK_MATCHING.md');
