#!/usr/bin/env node
/*
 * Trims an "Apple Music Play Activity.csv" export down to only the columns the
 * analyser needs. The raw export has 100+ columns of telemetry and can be
 * hundreds of MB, which is slow to parse in the browser. This streams the file
 * (low memory) and writes a much smaller CSV that loads far faster.
 *
 * Usage:
 *   node scripts/trim-play-activity.js "Apple Music Play Activity.csv"
 *   node scripts/trim-play-activity.js input.csv output.csv
 *
 * Keep this column list in sync with PLAY_ACTIVITY_COLUMNS in src/components/Banner.jsx.
 */
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const COLUMNS = [
    'Song Name',
    'Album Name',
    'Play Duration Milliseconds',
    'Media Duration In Milliseconds',
    'Start Position In Milliseconds',
    'End Position In Milliseconds',
    'Event End Timestamp',
    'End Reason Type',
    'UTC Offset In Seconds',
    'Item Type',
    'Media Type'
];

const input = process.argv[2];
if (!input) {
    console.error('Usage: node scripts/trim-play-activity.js <input.csv> [output.csv]');
    process.exit(1);
}
const output = process.argv[3] || input.replace(/\.csv$/i, '') + '-trimmed.csv';
if (path.resolve(input) === path.resolve(output)) {
    console.error('Refusing to overwrite the input file — give a different output path.');
    process.exit(1);
}

function field(v) {
    v = (v == null) ? '' : String(v);
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

const out = fs.createWriteStream(output);
out.write(COLUMNS.join(',') + '\n');

let rows = 0;
Papa.parse(fs.createReadStream(input), {
    header: true,
    skipEmptyLines: true,
    step: (results) => {
        const row = results.data;
        if (!row || !row['Song Name']) return;
        out.write(COLUMNS.map((c) => field(row[c])).join(',') + '\n');
        rows += 1;
    },
    complete: () => {
        out.end(() => {
            const inMB = (fs.statSync(input).size / 1e6).toFixed(1);
            const outMB = (fs.statSync(output).size / 1e6).toFixed(1);
            console.log(`Done: ${rows.toLocaleString()} rows`);
            console.log(`${inMB} MB -> ${outMB} MB`);
            console.log(`Wrote ${output}`);
        });
    },
    error: (err) => {
        console.error('Error:', err.message);
        process.exit(1);
    }
});
