import moment from 'moment';
import TrackMatcher from './TrackMatcher';
// import {timestamp} from 'moment-timezone';

function varExists(el) { 
    if (el !== null && typeof el !== "undefined" ) { 
      return true; 
    } else { 
      return false; 
    } 
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
                /* useful code here */
                result.push({
                    key: key,
                    value: array[key]
                });
            }
        }
        return result
    }

    static getArtistName(play, libraryIndex) {
        // First, try to get artist name from the play record itself
        // Check multiple possible column names in order of preference
        const possibleArtistColumns = [
            "Artist Name",           // Standard column name
            "Artist",                // Alternative column name
            "Container Artist Name", // Container metadata
            "artist",                // Lowercase variant
            "artist_name"            // Snake case variant
        ];

        for (const columnName of possibleArtistColumns) {
            if (varExists(play[columnName]) && play[columnName].length > 0) {
                return play[columnName];
            }
        }

        // If no artist name in play record, try to get it from library
        if (libraryIndex && varExists(play["Song Name"])) {
            const normalizedSongName = play["Song Name"].toLowerCase().trim().replace(/\s+/g, ' ');
            const libraryEntry = libraryIndex[normalizedSongName];
            
            if (libraryEntry && libraryEntry.tracks && libraryEntry.tracks.length > 0) {
                // Get artist name from the first matching track
                const track = libraryEntry.tracks[0];
                const artistName = track["Artist Name"] || track["Artist"] || track["artist"];
                if (varExists(artistName) && artistName.length > 0) {
                    return artistName;
                }
            }
        }

        // Fall back to "Unknown Artist" if we can't find it
        // Log a warning on the first occurrence to help with debugging
        if (!Computation._unknownArtistWarningLogged) {
            console.warn('Artist name not found for song:', play["Song Name"], '- Using "Unknown Artist" fallback. Check that your CSV has an artist column or upload a library file.');
            Computation._unknownArtistWarningLogged = true;
        }
        return "Unknown Artist";
    }

    static isSamePlay(play, previousPlay) {
        if (previousPlay != null &&
            Computation.isPlay(previousPlay) && 
            Computation.isPlay(play) &&
            previousPlay["Song Name"] === play["Song Name"] &&
            previousPlay["Artist Name"] === play["Artist Name"] &&
            previousPlay["End Position In Milliseconds"] === play["Start Position In Milliseconds"] &&
            previousPlay["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED") {
            return true;
        } else {
            return false;
        }
    }

    static isSamePlayNext(play, nextPlay) {
        if (nextPlay != null &&
            Computation.isPlay(nextPlay) && 
            Computation.isPlay(play) &&
            nextPlay["Song Name"] === play["Song Name"] &&
            nextPlay["Artist Name"] === play["Artist Name"] &&
            play["End Position In Milliseconds"] === nextPlay["Start Position In Milliseconds"] &&
            play["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED") {
            return true;
        } else {
            return false;
        }
    }

    static isPlay(play) {
        if (varExists(play["Song Name"]) && play["Song Name"].length > 0 && Number(play["Media Duration In Milliseconds"]) > 0 && play["Item Type"] !== "ORIGINAL_CONTENT_SHOWS" && play["Media Type"] !== "VIDEO" && play["End Reason Type"] !== "FAILED_TO_LOAD") {
            return true;
        } else {
            return false;
        }
    }

    

    static calculateTop(data, excludedSongs, callback, libraryTracks = null) {

        let today = new Date().getFullYear();
        if (new Date().getMonth() < 5) {
            today = today - 1
        }

        // Build library index for artist lookup
        let libraryIndex = null;
        if (libraryTracks && Array.isArray(libraryTracks) && libraryTracks.length > 0) {
            libraryIndex = TrackMatcher.buildLibraryIndex(libraryTracks);
        }

        // Perform track matching if library data is provided
        let matchResults = null;
        if (libraryTracks && Array.isArray(libraryTracks) && libraryTracks.length > 0) {
            matchResults = TrackMatcher.matchPlayActivity(data, libraryTracks);
        }

        var songs = {};
        var artists = {};
        var yearSongs = {};
        var thisYear = {
            totalPlays: 0,
            totalTime: 0,
            year: today,
            artists: {}
        }
        var days = {};
        var months = {};
        var totals = {
            totalPlays: 0,
            totalTime: 0,
            totalLyrics: 0
        };
        var heatmapData = [
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
        ];
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
        }


        // callback({
        //     songs: [],
        //     days: [],
        //     months: [],
        //     reasons: [],
        //     years: [],
        //     artists: [],
        //     totals: totals,
        //     filteredSongs: [],
        //     excludedSongs: [],
        //     hoursArray: heatmapData
        // })


        var previousPlay;

        for (let index = 0; index < data.length; index++) {
            const play = data[index];

            

            if (varExists(play["Song Name"]) && varExists(play["Play Duration Milliseconds"]) && varExists(play["Media Duration In Milliseconds"]) && varExists(play["Event End Timestamp"]) && varExists(play["UTC Offset In Seconds"])) {
                reasons[play["End Reason Type"]] = reasons[play["End Reason Type"]] + 1;


                if (Computation.isPlay(play)) {
                    // Get artist name from play data or library
                    const artistName = Computation.getArtistName(play, libraryIndex);
                    const uniqueID = "'" + play["Song Name"] + "' by " + artistName;
                    
                    if (Number(play["Play Duration Milliseconds"]) > 8000 /*&& (play["Event Type"] === "PLAY_END" || play["Event Type"] === "")*/) {
    
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
    
    
                        var missedMilliseconds = Number(play["Media Duration In Milliseconds"]) - Number(play["Play Duration Milliseconds"])
    
                        if (Computation.isSamePlayNext(play, data[index+1])) {
                            missedMilliseconds = 0;
                        }
    
                        if (!Computation.isSamePlay(play, previousPlay)) {
                            songs[uniqueID].plays = songs[uniqueID].plays + 1;

                        }
    
                        songs[uniqueID].time = Number(songs[uniqueID].time) + Number(play["Play Duration Milliseconds"]);
                        songs[uniqueID].missedTime = Number(songs[uniqueID].missedTime) + missedMilliseconds;
    
    
                        if (!songs[uniqueID].excluded) {
    
                            if (artists[artistName] == null) {
                                artists[artistName] = {
                                    plays: 0,
                                    time: 0,
                                    missedTime: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                totals.totalPlays = totals.totalPlays + 1;
                                artists[artistName].plays = artists[artistName].plays + 1;
                            }
    
    
                            totals.totalTime = Number(totals.totalTime) + Number(play["Play Duration Milliseconds"]);
                            artists[artistName].time = Number(artists[artistName].time) + Number(play["Play Duration Milliseconds"]);
                            artists[artistName].missedTime = Number(artists[artistName].missedTime) + missedMilliseconds;
    
    
                            var date = new Date(play["Event End Timestamp"]);
                            var dayID = date.getDate() + " " + Computation.monthNames[date.getMonth()] + ", " + date.getFullYear();
    
                            if (days[dayID] == null) {
                                days[dayID] = {
                                    plays: 0,
                                    time: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                days[dayID].plays = days[dayID].plays + 1;
                            }
                            days[dayID].time = Number(days[dayID].time) + Number(play["Play Duration Milliseconds"]);
    
                            var offset = Number(play["UTC Offset In Seconds"]) / 60;
                            var day = moment(date).utcOffset(offset);
                            var dayint = day.day();
                            var hoursint = day.hours();
                            if (varExists(dayint) && dayint < 7 && dayint > 0 && varExists(hoursint) && varExists(heatmapData[dayint][hoursint])  && varExists(Number(heatmapData[dayint][hoursint])) && !isNaN(Number(heatmapData[dayint][hoursint])) && !isNaN(Number(play["Play Duration Milliseconds"]))) {
                                heatmapData[dayint][hoursint] = Number(heatmapData[dayint][hoursint]) + Number(play["Play Duration Milliseconds"]);
                            }
                            
    
    
    
                            var monthID = date.getFullYear() + "-" + Computation.monthNames[date.getMonth()];
    
                            if (months[monthID] == null) {
                                months[monthID] = {
                                    plays: 0,
                                    time: 0,
                                    missedTime: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                months[monthID].plays = months[monthID].plays + 1;
                            }
                            months[monthID].time = Number(months[monthID].time) + Number(play["Play Duration Milliseconds"]);
                            months[monthID].missedTime = Number(months[monthID].missedTime) + missedMilliseconds;
    
                            var yearID = date.getFullYear()
    
                            if (yearSongs[yearID] == null) {
                                yearSongs[yearID] = {};
                            }
    
                            if (yearSongs[yearID][uniqueID] == null) {
                                yearSongs[yearID][uniqueID] = {
                                    plays: 0,
                                    time: 0,
                                    name: play["Song Name"],
                                    artist: artistName,
                                    missedTime: 0
                                };
                            }
    
                            
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                yearSongs[yearID][uniqueID].plays = yearSongs[yearID][uniqueID].plays + 1;
                            }
                            yearSongs[yearID][uniqueID].time = Number(yearSongs[yearID][uniqueID].time) + Number(play["Play Duration Milliseconds"]);
                            yearSongs[yearID][uniqueID].missedTime = Number(yearSongs[yearID][uniqueID].missedTime) + missedMilliseconds;
    
    
                            if (today === yearID) {
                                if (thisYear.artists[artistName] == null) {
                                    thisYear.artists[artistName] = {
                                        plays: 0,
                                        time: 0,
                                        missedTime: 0
                                    };
                                }
        
                                if (!Computation.isSamePlay(play, previousPlay)) {
                                    thisYear.totalPlays = thisYear.totalPlays + 1;
                                    thisYear.artists[artistName].plays = thisYear.artists[artistName].plays + 1;
                                }
        
        
                                thisYear.totalTime = Number(thisYear.totalTime) + Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[artistName].time = Number(thisYear.artists[artistName].time) + Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[artistName].missedTime = Number(thisYear.artists[artistName].missedTime) + missedMilliseconds;
        
                            }
    
                        }
    
    
                    }
                }
            }

            

            // if (play["Event Type"] === "LYRIC_DISPLAY") {
            //     totals.totalLyrics = totals.totalLyrics + 1;
            // }

            previousPlay = play;


        }


        var result = Computation.convertObjectToArray(songs);
        result = result.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var filteredSongs = []
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
        }

        var resultDays = Computation.convertObjectToArray(days);
        resultDays = resultDays.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var resultMonths = Computation.convertObjectToArray(months);
        var artistsResults = Computation.convertObjectToArray(artists);
        artistsResults = artistsResults.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

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
            artists: artistsResults,
            totals: totals,
            filteredSongs: filteredSongs,
            excludedSongs: excludedSongs,
            hoursArray: heatmapData,
            thisYear: thisYearResult,
            matchResults: matchResults
        }


        callback(returnVal);
        console.log(returnVal);

        // return 
    }
}

export default Computation;
