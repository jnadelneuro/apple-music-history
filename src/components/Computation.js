import moment from 'moment';
import ArtistResolver from './ArtistResolver';

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
        if (days > 0) string = string + days + "d";
        if (hours > 0) string = string + " " + hours + "h";
        if (minutes > 0) string = string + " " + minutes + "m";
        if (seconds > 0) string = string + " " + seconds + "s";
        return string;
    }

    static convertObjectToArray(array) {
        var result = [];
        for (var key in array) {
            if (array.hasOwnProperty(key)) {
                result.push({ key: key, value: array[key] });
            }
        }
        return result;
    }

    // A play that was paused and then resumed shows up as consecutive records
    // where one segment's end position equals the next segment's start position.
    // Detecting that lets us avoid double-counting plays and skipped time.
    static isSamePlay(play, previousPlay) {
        return previousPlay != null &&
            Computation.isPlay(previousPlay) &&
            Computation.isPlay(play) &&
            previousPlay["Song Name"] === play["Song Name"] &&
            previousPlay["End Position In Milliseconds"] === play["Start Position In Milliseconds"] &&
            previousPlay["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED";
    }

    static isSamePlayNext(play, nextPlay) {
        return nextPlay != null &&
            Computation.isPlay(nextPlay) &&
            Computation.isPlay(play) &&
            nextPlay["Song Name"] === play["Song Name"] &&
            play["End Position In Milliseconds"] === nextPlay["Start Position In Milliseconds"] &&
            play["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED";
    }

    static isPlay(play) {
        return varExists(play["Song Name"]) && play["Song Name"].length > 0 &&
            Number(play["Media Duration In Milliseconds"]) > 0 &&
            play["Item Type"] !== "ORIGINAL_CONTENT_SHOWS" &&
            play["Media Type"] !== "VIDEO" &&
            play["End Reason Type"] !== "FAILED_TO_LOAD";
    }

    /**
     * Aggregates "Apple Music Play Activity" rows into the report.
     *
     * @param {Array}    data            per-event play rows
     * @param {Array}    excludedSongs   uniqueIDs the user excluded
     * @param {Function} callback        receives the assembled report
     * @param {Array}    libraryTracks   optional library JSON (artist source)
     * @param {Array}    dailyTracksRows optional daily-tracks rows (artist source)
     */
    static calculateTop(data, excludedSongs, callback, libraryTracks = null, dailyTracksRows = null) {
        let today = new Date().getFullYear();
        if (new Date().getMonth() < 5) {
            today = today - 1;
        }

        const resolver = new ArtistResolver(libraryTracks, dailyTracksRows);

        var songs = {};
        var artists = {};
        var albums = {};
        var yearSongs = {};
        var yearArtists = {};
        var yearAlbums = {};
        var thisYear = { totalPlays: 0, totalTime: 0, year: today, artists: {} };
        var days = {};
        var months = {};
        var totals = { totalPlays: 0, totalTime: 0, totalLyrics: 0 };
        var heatmapData = [];
        for (let d = 0; d < 7; d++) heatmapData.push(new Array(24).fill(0));
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

        var previousPlay;

        for (let index = 0; index < data.length; index++) {
            const play = data[index];
            if (!play) { previousPlay = play; continue; }

            if (varExists(play["Song Name"]) && varExists(play["Play Duration Milliseconds"]) &&
                varExists(play["Media Duration In Milliseconds"]) && varExists(play["Event End Timestamp"]) &&
                varExists(play["UTC Offset In Seconds"])) {

                const reason = play["End Reason Type"];
                reasons[reason] = (reasons[reason] || 0) + 1;

                if (Computation.isPlay(play)) {
                    const artistName = resolver.resolve(play["Song Name"], play["Album Name"]);
                    const uniqueID = "'" + play["Song Name"] + "' by " + artistName;

                    if (Number(play["Play Duration Milliseconds"]) > 8000) {

                        if (songs[uniqueID] == null) {
                            songs[uniqueID] = {
                                plays: 0,
                                time: 0,
                                name: play["Song Name"],
                                artist: artistName,
                                missedTime: 0,
                                excluded: excludedSongs.includes(uniqueID)
                            };
                        }

                        // Skipped (unplayed) time for the final segment of a play.
                        var missedMilliseconds = 0;
                        if (Computation.isSamePlayNext(play, data[index + 1])) {
                            // Will be resumed next; count its missed time later.
                            missedMilliseconds = 0;
                        } else {
                            var mediaDuration = Number(play["Media Duration In Milliseconds"]);
                            // Prefer the recorded end position; fall back to start + duration.
                            var endPosition;
                            if (varExists(play["End Position In Milliseconds"]) && play["End Position In Milliseconds"] !== "") {
                                endPosition = Number(play["End Position In Milliseconds"]);
                            } else {
                                endPosition = (Number(play["Start Position In Milliseconds"]) || 0) + Number(play["Play Duration Milliseconds"]);
                            }
                            missedMilliseconds = Math.max(0, mediaDuration - endPosition);
                        }

                        const newPlay = !Computation.isSamePlay(play, previousPlay);
                        if (newPlay) songs[uniqueID].plays += 1;
                        songs[uniqueID].time += Number(play["Play Duration Milliseconds"]);
                        songs[uniqueID].missedTime += missedMilliseconds;

                        if (!songs[uniqueID].excluded) {
                            if (artists[artistName] == null) {
                                artists[artistName] = { plays: 0, time: 0, missedTime: 0 };
                            }
                            if (newPlay) {
                                totals.totalPlays += 1;
                                artists[artistName].plays += 1;
                            }
                            totals.totalTime += Number(play["Play Duration Milliseconds"]);
                            artists[artistName].time += Number(play["Play Duration Milliseconds"]);
                            artists[artistName].missedTime += missedMilliseconds;

                            // Albums (native Album Name from Play Activity)
                            var albumName = play["Album Name"];
                            if (varExists(albumName) && albumName.length > 0) {
                                if (albums[albumName] == null) {
                                    albums[albumName] = { plays: 0, time: 0, missedTime: 0 };
                                }
                                if (newPlay) albums[albumName].plays += 1;
                                albums[albumName].time += Number(play["Play Duration Milliseconds"]);
                                albums[albumName].missedTime += missedMilliseconds;
                            }

                            var date = new Date(play["Event End Timestamp"]);
                            var dayID = date.getDate() + " " + Computation.monthNames[date.getMonth()] + ", " + date.getFullYear();
                            if (days[dayID] == null) days[dayID] = { plays: 0, time: 0 };
                            if (newPlay) days[dayID].plays += 1;
                            days[dayID].time += Number(play["Play Duration Milliseconds"]);

                            var offset = Number(play["UTC Offset In Seconds"]) / 60;
                            var day = moment(date).utcOffset(offset);
                            var dayint = day.day();
                            var hoursint = day.hours();
                            if (dayint >= 0 && dayint < 7 && varExists(hoursint) &&
                                !isNaN(Number(play["Play Duration Milliseconds"]))) {
                                heatmapData[dayint][hoursint] += Number(play["Play Duration Milliseconds"]);
                            }

                            var monthID = date.getFullYear() + "-" + Computation.monthNames[date.getMonth()];
                            if (months[monthID] == null) {
                                months[monthID] = { plays: 0, time: 0, missedTime: 0, sortKey: date.getFullYear() * 100 + date.getMonth() };
                            }
                            if (newPlay) months[monthID].plays += 1;
                            months[monthID].time += Number(play["Play Duration Milliseconds"]);
                            months[monthID].missedTime += missedMilliseconds;

                            var yearID = date.getFullYear();

                            if (yearSongs[yearID] == null) yearSongs[yearID] = {};
                            if (yearSongs[yearID][uniqueID] == null) {
                                yearSongs[yearID][uniqueID] = { plays: 0, time: 0, name: play["Song Name"], artist: artistName, missedTime: 0 };
                            }
                            if (newPlay) yearSongs[yearID][uniqueID].plays += 1;
                            yearSongs[yearID][uniqueID].time += Number(play["Play Duration Milliseconds"]);
                            yearSongs[yearID][uniqueID].missedTime += missedMilliseconds;

                            if (yearArtists[yearID] == null) yearArtists[yearID] = {};
                            if (yearArtists[yearID][artistName] == null) {
                                yearArtists[yearID][artistName] = { plays: 0, time: 0, missedTime: 0 };
                            }
                            if (newPlay) yearArtists[yearID][artistName].plays += 1;
                            yearArtists[yearID][artistName].time += Number(play["Play Duration Milliseconds"]);
                            yearArtists[yearID][artistName].missedTime += missedMilliseconds;

                            if (varExists(albumName) && albumName.length > 0) {
                                if (yearAlbums[yearID] == null) yearAlbums[yearID] = {};
                                if (yearAlbums[yearID][albumName] == null) {
                                    yearAlbums[yearID][albumName] = { plays: 0, time: 0, missedTime: 0 };
                                }
                                if (newPlay) yearAlbums[yearID][albumName].plays += 1;
                                yearAlbums[yearID][albumName].time += Number(play["Play Duration Milliseconds"]);
                                yearAlbums[yearID][albumName].missedTime += missedMilliseconds;
                            }

                            if (today === yearID) {
                                if (thisYear.artists[artistName] == null) {
                                    thisYear.artists[artistName] = { plays: 0, time: 0, missedTime: 0 };
                                }
                                if (newPlay) {
                                    thisYear.totalPlays += 1;
                                    thisYear.artists[artistName].plays += 1;
                                }
                                thisYear.totalTime += Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[artistName].time += Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[artistName].missedTime += missedMilliseconds;
                            }
                        }
                    }
                }
            }

            previousPlay = play;
        }

        var result = Computation.convertObjectToArray(songs);
        result = result.sort((a, b) => b.value.time - a.value.time);

        var filteredSongs = [];
        for (let index = 0; index < result.length; index++) {
            if (!result[index].value.excluded) filteredSongs.push(result[index]);
        }

        var yearresult = Computation.convertObjectToArray(yearSongs);
        for (let index = 0; index < yearresult.length; index++) {
            yearresult[index].value = Computation.convertObjectToArray(yearresult[index].value)
                .sort((a, b) => b.value.time - a.value.time);
        }

        var yearArtistsResult = Computation.convertObjectToArray(yearArtists);
        for (let index = 0; index < yearArtistsResult.length; index++) {
            yearArtistsResult[index].value = Computation.convertObjectToArray(yearArtistsResult[index].value)
                .sort((a, b) => b.value.time - a.value.time);
        }

        var thisYearArtsistsResult = Computation.convertObjectToArray(thisYear.artists)
            .sort((a, b) => b.value.time - a.value.time);

        var thisYearSongs = Computation.convertObjectToArray(yearSongs[today])
            .sort((a, b) => b.value.time - a.value.time);

        var thisYearResult = {
            totalPlays: thisYear.totalPlays,
            totalTime: thisYear.totalTime,
            year: today,
            artists: thisYearArtsistsResult,
            songs: thisYearSongs
        };

        var resultDays = Computation.convertObjectToArray(days).sort((a, b) => b.value.time - a.value.time);

        var resultMonths = Computation.convertObjectToArray(months).sort((a, b) => a.value.sortKey - b.value.sortKey);

        var artistsResults = Computation.convertObjectToArray(artists).sort((a, b) => b.value.time - a.value.time);

        var albumsResults = Computation.convertObjectToArray(albums).sort((a, b) => b.value.time - a.value.time);

        var yearAlbumsResult = Computation.convertObjectToArray(yearAlbums);
        for (let index = 0; index < yearAlbumsResult.length; index++) {
            yearAlbumsResult[index].value = Computation.convertObjectToArray(yearAlbumsResult[index].value)
                .sort((a, b) => b.value.time - a.value.time);
        }

        var reasonsResults = Computation.convertObjectToArray(reasons).sort((a, b) => b.value - a.value);

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
