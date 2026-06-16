import LibraryIndex from './LibraryIndex';

function varExists(el) {
    return el !== null && typeof el !== "undefined";
}

class Computation {

    static monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    static convetrData(input) {
        var data = {
            labels: [],
            datasets: [{
                    label: "Played Hours",
                    backgroundColor: "rgba(251, 126, 42, 0.2)",
                    borderColor: "#FB7E2A",
                    pointBackgroundColor: "rgba(220,220,220,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    data: [],
                    fill: false
                },
                {
                    label: "Skipped Hours",
                    backgroundColor: "rgba(188, 210, 197, 0.2)",
                    borderColor: "#BCD2C5",
                    pointBackgroundColor: "rgba(220,220,220,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    data: [],
                    fill: false
                }
            ]
        }

        for (let index = 0; index < input.length; index++) {
            const element = input[index];
            data.labels.push(element.key);
            data.datasets[0].data.push(element.value.time / 1000 / 60 / 60);
            data.datasets[1].data.push(element.value.missedTime / 1000 / 60 / 60);
        }

        return data;
    }

    static convertTime(timeinmilli) {
        var seconds = parseInt(timeinmilli = timeinmilli / 1000) % 60;
        var minutes = parseInt(timeinmilli = timeinmilli / 60) % 60;
        var hours = parseInt(timeinmilli = timeinmilli / 60) % 24;
        var days = parseInt(timeinmilli = timeinmilli / 24);

        var string = "";

        if (days > 0) {
            string = string + days + "d";
        }
        if (hours > 0) {
            string = string + " " + hours + "h";
        }
        if (minutes > 0) {
            string = string + " " + minutes + "m";
        }
        if (seconds > 0) {
            string = string + " " + seconds + "s";
        }

        return string;
    }

    static convertObjectToArray(array) {
        var result = [];
        for (var key in array) {
            if (array.hasOwnProperty(key)) {
                result.push({
                    key: key,
                    value: array[key]
                });
            }
        }
        return result;
    }

    /**
     * Splits a "Track Description" / "Track Name" ("Artist - Title") into parts.
     * The play-history files carry the artist inline, so no library lookup is
     * needed to attribute artists. Splits on the first " - " (covers 99.9% of
     * rows; titles that themselves contain " - " keep the remainder as the title).
     */
    static parseTrackDescription(desc) {
        if (!varExists(desc) || typeof desc !== 'string') {
            return { artist: 'Unknown Artist', name: '' };
        }
        const sep = desc.indexOf(' - ');
        if (sep === -1) {
            return { artist: 'Unknown Artist', name: desc.trim() };
        }
        return {
            artist: desc.slice(0, sep).trim(),
            name: desc.slice(sep + 3).trim()
        };
    }

    /**
     * Parses an Apple "Date Played" value ("YYYYMMDD") into date parts.
     * @returns {{year:number, monthIdx:number, day:number} | null}
     */
    static parsePlayedDate(value) {
        const s = String(value || '').trim();
        if (!/^\d{8}$/.test(s)) return null;
        const year = Number(s.slice(0, 4));
        const monthIdx = Number(s.slice(4, 6)) - 1;
        const day = Number(s.slice(6, 8));
        if (monthIdx < 0 || monthIdx > 11 || day < 1 || day > 31) return null;
        return { year, monthIdx, day };
    }

    /**
     * Aggregates "Apple Music - Play History Daily Tracks.csv" rows into the
     * report. Each row is a per-day, per-track aggregate carrying Play Count,
     * Skip Count, Play Duration, a Track Identifier and a "Artist - Title"
     * Track Description.
     *
     * @param {Array}    data          parsed daily-tracks rows
     * @param {Array}    excludedSongs  uniqueIDs the user has excluded
     * @param {Function} callback       receives the assembled report
     * @param {Array}    libraryTracks  optional library JSON, used only for albums
     */
    static calculateTop(data, excludedSongs, callback, libraryTracks = null) {
        let today = new Date().getFullYear();
        if (new Date().getMonth() < 5) {
            today = today - 1;
        }

        // Library is optional and used solely to recover albums (and track
        // durations for skipped-time) via exact Track Identifier joins.
        let libraryIndex = null;
        if (Array.isArray(libraryTracks) && libraryTracks.length > 0) {
            libraryIndex = LibraryIndex.build(libraryTracks);
        }

        var songs = {};
        var artists = {};
        var albums = {};
        var yearSongs = {};
        var yearArtists = {};
        var yearAlbums = {};
        var thisYear = {
            totalPlays: 0,
            totalTime: 0,
            year: today,
            artists: {}
        };
        var days = {};
        var months = {};
        var totals = {
            totalPlays: 0,
            totalTime: 0,
            totalLyrics: 0
        };
        var heatmapData = [];
        for (let d = 0; d < 7; d++) {
            heatmapData.push(new Array(24).fill(0));
        }
        var reasons = {
            "SCRUB_END": 0,
            "MANUALLY_SELECTED_PLAYBACK_OF_A_DIFF_ITEM": 0,
            "PLAYBACK_MANUALLY_PAUSED": 0,
            "FAILED_TO_LOAD": 0,
            "TRACK_SKIPPED_FORWARDS": 0,
            "SCRUB_BEGIN": 0,
            "NATURAL_END_OF_TRACK": 0,
            "TRACK_SKIPPED_BACKWARDS": 0,
            "NOT_APPLICABLE": 0,
            "PLAYBACK_STOPPED_DUE_TO_SESSION_TIMEOUT": 0,
            "TRACK_BANNED": 0,
            "QUICK_PLAY": 0,
            "": 0
        };

        for (let index = 0; index < data.length; index++) {
            const row = data[index];
            if (!row) continue;

            const description = row["Track Description"] || row["Track Name"];
            if (!varExists(description) || description.length === 0) continue;

            const date = Computation.parsePlayedDate(row["Date Played"]);
            if (!date) continue;

            const { artist, name } = Computation.parseTrackDescription(description);
            if (!name) continue;

            const playCount = Number(row["Play Count"]) || 0;
            const skipCount = Number(row["Skip Count"]) || 0;
            const time = Number(row["Play Duration Milliseconds"]) || 0;
            if (playCount === 0 && time === 0 && skipCount === 0) continue;

            const endReason = row["End Reason Type"] || "";

            // Album (and track duration) from the library via exact id join.
            let album = "Unknown Album";
            let duration = 0;
            const libEntry = LibraryIndex.lookup(libraryIndex, row["Track Identifier"]);
            if (libEntry) {
                if (libEntry.album) album = libEntry.album;
                duration = libEntry.duration || 0;
            }
            const albumKnown = album !== "Unknown Album";

            // Skipped/unplayed time is only knowable when the library supplies a
            // track duration; otherwise it stays 0 rather than being guessed.
            let missedTime = 0;
            if (duration > 0 && playCount > 0) {
                missedTime = Math.max(0, duration * playCount - time);
            }

            reasons[endReason] = (reasons[endReason] || 0) + playCount + skipCount;

            const uniqueID = "'" + name + "' by " + artist;

            if (songs[uniqueID] == null) {
                songs[uniqueID] = {
                    plays: 0,
                    time: 0,
                    name: name,
                    artist: artist,
                    missedTime: 0,
                    skips: 0,
                    excluded: excludedSongs.includes(uniqueID)
                };
            }
            songs[uniqueID].plays += playCount;
            songs[uniqueID].time += time;
            songs[uniqueID].missedTime += missedTime;
            songs[uniqueID].skips += skipCount;

            if (songs[uniqueID].excluded) continue;

            // Artists
            if (artists[artist] == null) {
                artists[artist] = { plays: 0, time: 0, missedTime: 0, skips: 0 };
            }
            artists[artist].plays += playCount;
            artists[artist].time += time;
            artists[artist].missedTime += missedTime;
            artists[artist].skips += skipCount;

            totals.totalPlays += playCount;
            totals.totalTime += time;

            // Albums (only when the library resolved a real album name)
            if (albumKnown) {
                if (albums[album] == null) {
                    albums[album] = { plays: 0, time: 0, missedTime: 0 };
                }
                albums[album].plays += playCount;
                albums[album].time += time;
                albums[album].missedTime += missedTime;
            }

            // Days
            const dateObj = new Date(date.year, date.monthIdx, date.day);
            const dayID = date.day + " " + Computation.monthNames[date.monthIdx] + ", " + date.year;
            if (days[dayID] == null) {
                days[dayID] = { plays: 0, time: 0 };
            }
            days[dayID].plays += playCount;
            days[dayID].time += time;

            // Hour-of-week heatmap: spread the row's time across the hours it lists.
            const dow = dateObj.getDay(); // 0 = Sunday .. 6 = Saturday
            const hourList = String(row["Hours"] || "")
                .split(",")
                .map(h => parseInt(h.trim(), 10))
                .filter(h => !isNaN(h) && h >= 0 && h < 24);
            if (hourList.length > 0 && dow >= 0 && dow < 7) {
                const share = time / hourList.length;
                for (const h of hourList) {
                    heatmapData[dow][h] += share;
                }
            }

            // Months (keep chronological sort key for the line chart)
            const monthID = date.year + "-" + Computation.monthNames[date.monthIdx];
            if (months[monthID] == null) {
                months[monthID] = { plays: 0, time: 0, missedTime: 0, sortKey: date.year * 100 + date.monthIdx };
            }
            months[monthID].plays += playCount;
            months[monthID].time += time;
            months[monthID].missedTime += missedTime;

            const yearID = date.year;

            // Songs per year
            if (yearSongs[yearID] == null) yearSongs[yearID] = {};
            if (yearSongs[yearID][uniqueID] == null) {
                yearSongs[yearID][uniqueID] = {
                    plays: 0, time: 0, name: name, artist: artist, missedTime: 0
                };
            }
            yearSongs[yearID][uniqueID].plays += playCount;
            yearSongs[yearID][uniqueID].time += time;
            yearSongs[yearID][uniqueID].missedTime += missedTime;

            // Artists per year
            if (yearArtists[yearID] == null) yearArtists[yearID] = {};
            if (yearArtists[yearID][artist] == null) {
                yearArtists[yearID][artist] = { plays: 0, time: 0, missedTime: 0 };
            }
            yearArtists[yearID][artist].plays += playCount;
            yearArtists[yearID][artist].time += time;
            yearArtists[yearID][artist].missedTime += missedTime;

            // Albums per year
            if (albumKnown) {
                if (yearAlbums[yearID] == null) yearAlbums[yearID] = {};
                if (yearAlbums[yearID][album] == null) {
                    yearAlbums[yearID][album] = { plays: 0, time: 0, missedTime: 0 };
                }
                yearAlbums[yearID][album].plays += playCount;
                yearAlbums[yearID][album].time += time;
                yearAlbums[yearID][album].missedTime += missedTime;
            }

            // Current-year summary (powers the "Wrapped" view)
            if (today === yearID) {
                if (thisYear.artists[artist] == null) {
                    thisYear.artists[artist] = { plays: 0, time: 0, missedTime: 0 };
                }
                thisYear.totalPlays += playCount;
                thisYear.totalTime += time;
                thisYear.artists[artist].plays += playCount;
                thisYear.artists[artist].time += time;
                thisYear.artists[artist].missedTime += missedTime;
            }
        }

        var result = Computation.convertObjectToArray(songs);
        result = result.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var filteredSongs = [];
        for (let index = 0; index < result.length; index++) {
            if (!result[index].value.excluded) {
                filteredSongs.push(result[index]);
            }
        }

        var yearresult = Computation.convertObjectToArray(yearSongs);
        for (let index = 0; index < yearresult.length; index++) {
            yearresult[index].value = Computation.convertObjectToArray(yearresult[index].value);
            yearresult[index].value = yearresult[index].value.sort(function (a, b) {
                return b.value.time - a.value.time;
            });
        }

        var yearArtistsResult = Computation.convertObjectToArray(yearArtists);
        for (let index = 0; index < yearArtistsResult.length; index++) {
            yearArtistsResult[index].value = Computation.convertObjectToArray(yearArtistsResult[index].value);
            yearArtistsResult[index].value = yearArtistsResult[index].value.sort(function (a, b) {
                return b.value.time - a.value.time;
            });
        }

        var thisYearArtsistsResult = Computation.convertObjectToArray(thisYear.artists);
        thisYearArtsistsResult = thisYearArtsistsResult.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearSongs = Computation.convertObjectToArray(yearSongs[today]);
        thisYearSongs = thisYearSongs.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearResult = {
            totalPlays: thisYear.totalPlays,
            totalTime: thisYear.totalTime,
            year: today,
            artists: thisYearArtsistsResult,
            songs: thisYearSongs
        };

        var resultDays = Computation.convertObjectToArray(days);
        resultDays = resultDays.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var resultMonths = Computation.convertObjectToArray(months);
        resultMonths = resultMonths.sort(function (a, b) {
            return a.value.sortKey - b.value.sortKey;
        });

        var artistsResults = Computation.convertObjectToArray(artists);
        artistsResults = artistsResults.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var albumsResults = Computation.convertObjectToArray(albums);
        albumsResults = albumsResults.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var yearAlbumsResult = Computation.convertObjectToArray(yearAlbums);
        for (let index = 0; index < yearAlbumsResult.length; index++) {
            yearAlbumsResult[index].value = Computation.convertObjectToArray(yearAlbumsResult[index].value);
            yearAlbumsResult[index].value = yearAlbumsResult[index].value.sort(function (a, b) {
                return b.value.time - a.value.time;
            });
        }

        var reasonsResults = Computation.convertObjectToArray(reasons);
        reasonsResults = reasonsResults.sort(function (a, b) {
            return b.value - a.value;
        });

        var returnVal = {
            songs: result,
            days: resultDays,
            months: resultMonths,
            reasons: reasonsResults,
            years: yearresult,
            yearArtists: yearArtistsResult,
            yearAlbums: yearAlbumsResult,
            artists: artistsResults,
            albums: albumsResults,
            totals: totals,
            filteredSongs: filteredSongs,
            excludedSongs: excludedSongs,
            hoursArray: heatmapData,
            thisYear: thisYearResult,
            matchResults: null
        };

        callback(returnVal);
    }
}

export default Computation;
