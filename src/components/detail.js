import moment from 'moment';
import Computation from './Computation';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function hourLabel(h) {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/**
 * Does a raw play row belong to the chosen entity?
 *  - album:  match the native Album Name
 *  - song:   match Song Name AND the resolved artist
 *  - artist: match the resolved artist
 */
function matchesEntity(play, entity, resolver) {
    if (entity.type === 'album') return (play['Album Name'] || '') === entity.album;
    if (entity.type === 'song') {
        if (play['Song Name'] !== entity.name) return false;
        return resolver.resolve(play['Song Name'], play['Album Name']) === entity.artist;
    }
    if (entity.type === 'artist') {
        return resolver.resolve(play['Song Name'], play['Album Name']) === entity.artist;
    }
    return false;
}

/**
 * Walks the raw play rows once and builds a "when did I listen to this" breakdown
 * for a single song / artist / album. Counts plays/time the same way the charts do
 * (>8s, real plays, paused/resumed segments collapsed), bucketing by year, month,
 * day-of-week, hour-of-day and calendar date (all in the listener's local time).
 */
export function computeEntityDetail(data, resolver, entity) {
    const years = {};
    const months = MONTH_LABELS.map(() => ({ plays: 0, time: 0 }));
    const dows = DOW_LABELS.map(() => ({ plays: 0, time: 0 }));
    const hours = Array.from({ length: 24 }, () => ({ plays: 0, time: 0 }));
    const dates = {};

    let plays = 0, time = 0, missedTime = 0, first = null, last = null;
    let prev;

    for (let i = 0; i < data.length; i++) {
        const play = data[i];
        if (
            Computation.isPlay(play) &&
            Number(play['Play Duration Milliseconds']) > 8000 &&
            matchesEntity(play, entity, resolver)
        ) {
            const t = Number(play['Play Duration Milliseconds']) || 0;
            const newPlay = !Computation.isSamePlay(play, prev);

            let missed = 0;
            if (!Computation.isSamePlayNext(play, data[i + 1])) {
                const media = Number(play['Media Duration In Milliseconds']) || 0;
                let endPos;
                if (play['End Position In Milliseconds'] !== undefined && play['End Position In Milliseconds'] !== '') {
                    endPos = Number(play['End Position In Milliseconds']);
                } else {
                    endPos = (Number(play['Start Position In Milliseconds']) || 0) + t;
                }
                missed = Math.max(0, media - endPos);
            }

            const date = new Date(play['Event End Timestamp']);
            const m = moment(date).utcOffset(Number(play['UTC Offset In Seconds']) / 60);
            const y = m.year();

            if (!years[y]) years[y] = { plays: 0, time: 0 };
            years[y].time += t;
            months[m.month()].time += t;
            dows[m.day()].time += t;
            hours[m.hour()].time += t;
            if (newPlay) {
                years[y].plays += 1;
                months[m.month()].plays += 1;
                dows[m.day()].plays += 1;
                hours[m.hour()].plays += 1;
                plays += 1;
            }
            const dk = m.format('YYYY-MM-DD');
            dates[dk] = (dates[dk] || 0) + t;

            time += t;
            missedTime += missed;
            if (!first || date < first) first = date;
            if (!last || date > last) last = date;
        }
        prev = play;
    }

    const yearsArr = Object.keys(years)
        .sort((a, b) => Number(a) - Number(b))
        .map((y) => ({ label: y, ...years[y] }));

    return {
        entity,
        plays,
        time,
        missedTime,
        first,
        last,
        years: yearsArr,
        months: months.map((b, i) => ({ label: MONTH_LABELS[i], ...b })),
        dows: dows.map((b, i) => ({ label: DOW_LABELS[i], ...b })),
        hours: hours.map((b, i) => ({ label: hourLabel(i), ...b })),
        dates
    };
}

/**
 * Flattens the computed results into a searchable list of songs / artists / albums.
 */
export function buildSearchItems(results) {
    const items = [];
    for (const s of results.songs || []) {
        items.push({ type: 'song', key: s.key, name: s.value.name, artist: s.value.artist, plays: s.value.plays, time: s.value.time });
    }
    for (const a of results.artists || []) {
        if (a.key === 'Unknown Artist') continue;
        items.push({ type: 'artist', key: a.key, artist: a.key, plays: a.value.plays, time: a.value.time });
    }
    for (const al of results.albums || []) {
        items.push({ type: 'album', key: al.key, album: al.key, plays: al.value.plays, time: al.value.time });
    }
    return items;
}

export function searchItems(items, query, limit = 60) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
        .filter((it) => {
            const name = (it.name || '').toLowerCase();
            const artist = (it.artist || '').toLowerCase();
            const album = (it.album || '').toLowerCase();
            return name.includes(q) || artist.includes(q) || album.includes(q);
        })
        .sort((a, b) => b.plays - a.plays)
        .slice(0, limit);
}
