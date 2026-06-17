import Computation from './Computation';

/**
 * Merges per-year ranked lists across a chosen set of years.
 *
 * `perYearArray` is shaped like `results.years` / `results.yearArtists` /
 * `results.yearAlbums`: an array of `{ key: yearString, value: [ {key, value:{plays,time,missedTime,name?,artist?}} ] }`.
 *
 * Returns a single list (same `{key, value}` entry shape) with plays/time/missedTime
 * summed across the selected years and sorted by total listen time descending.
 */
export function mergeYears(perYearArray, selectedYears) {
    const selected = new Set((selectedYears || []).map(String));
    const merged = {};

    for (const yearEntry of perYearArray || []) {
        if (!selected.has(String(yearEntry.key))) continue;
        for (const item of yearEntry.value || []) {
            let acc = merged[item.key];
            if (!acc) {
                acc = merged[item.key] = {
                    plays: 0,
                    time: 0,
                    missedTime: 0,
                    name: item.value.name,
                    artist: item.value.artist
                };
            }
            acc.plays += item.value.plays || 0;
            acc.time += item.value.time || 0;
            acc.missedTime += item.value.missedTime || 0;
        }
    }

    return Computation.convertObjectToArray(merged).sort((a, b) => b.value.time - a.value.time);
}

/**
 * All distinct years present across the per-year result arrays, sorted newest-first.
 */
export function availableYears(results) {
    const years = new Set();
    for (const arr of [results.years, results.yearArtists, results.yearAlbums]) {
        for (const y of arr || []) years.add(String(y.key));
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

/**
 * The per-year ranked list for a single year (or [] if that year has no data).
 */
export function yearSlice(perYearArray, year) {
    const entry = (perYearArray || []).find(y => String(y.key) === String(year));
    return entry ? entry.value : [];
}
