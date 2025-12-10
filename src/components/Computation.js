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
    static _unknownArtistWarningLogged = false;



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
        // Look up artist name from library based on song name
        if (libraryIndex && varExists(play["Song Name"])) {
            const normalizedSongName = play["Song Name"].toLowerCase().trim().replace(/\s+/g, ' ');

            if (play["Song Name"] === "That Funny Feeling") {
            // Place breakpoint here for debugging - no match found in library
                debugger;
            }
            // Since we updated buildLibraryIndex, this lookup now handles 
            // "For Free?" finding "For Free? (Interlude)" automatically.
            const libraryEntry = libraryIndex[normalizedSongName];
            
            if (libraryEntry && libraryEntry.tracks && libraryEntry.tracks.length > 0) {
                const tracks = libraryEntry.tracks;
                
                // If only one match, use it directly
                if (tracks.length === 1) {
                    const artistName = tracks[0]["Artist"] || tracks[0]["Artist Name"] || tracks[0]["artist"];
                    if (varExists(artistName) && artistName.length > 0) {
                        return artistName;
                    }
                } else {
                    // Multiple matches - first check if all tracks have the same artist
                    const firstArtist = tracks[0]["Artist"] || tracks[0]["Artist Name"] || tracks[0]["artist"];
                    if (varExists(firstArtist) && firstArtist.length > 0) {
                        const allSameArtist = tracks.every(track => {
                            const artistName = track["Artist"] || track["Artist Name"] || track["artist"];
                            return artistName === firstArtist;
                        });
                        
                        if (allSameArtist) {
                            return firstArtist;
                        }
                        
                        // Check if one artist name is contained within others
                        const artistNames = tracks
                            .map(track => track["Artist"] || track["Artist Name"] || track["artist"])
                            .filter(name => varExists(name) && name.length > 0);
                        
                        // Find the shortest artist name that is contained in all others
                        const sortedByLength = [...artistNames].sort((a, b) => a.length - b.length);
                        for (const shortArtist of sortedByLength) {
                            const shortNormalized = shortArtist.toLowerCase().trim();
                            const allContain = artistNames.every(name => 
                                name.toLowerCase().trim().includes(shortNormalized)
                            );
                            if (allContain) {
                                return shortArtist;
                            }
                        }
                    }

                    
                    // Different artists - try to find one with matching album
                    const playAlbum = play["Album Name"];
                    if (varExists(playAlbum)) {
                        const normalizedPlayAlbum = playAlbum.toLowerCase().trim().replace(/\s+/g, ' ');
                        
                        for (const track of tracks) {
                            const trackAlbum = track["Album"] || track["Album Name"] || track["album"];
                            if (varExists(trackAlbum)) {
                                const normalizedTrackAlbum = trackAlbum.toLowerCase().trim().replace(/\s+/g, ' ');
                                
                                // Specific edge case: Hamilton album name variations
                                const isHamiltonMatch = (a, b) => {
                                    const hamiltonCSV = "hamilton: an american musical (original broadway cast recording)";
                                    const hamiltonJSON = "hamilton (original broadway cast recording)";
                                    return (a === hamiltonCSV && b === hamiltonJSON) || 
                                           (a === hamiltonJSON && b === hamiltonCSV);
                                };
                                
                                // Check if albums are identical except for at most one character difference
                                const isAlmostIdentical = (a, b) => {
                                    if (a === b) return true;
                                    
                                    // Compare without spaces
                                    const aNoSpaces = a.replace(/\s+/g, '');
                                    const bNoSpaces = b.replace(/\s+/g, '');
                                    if (aNoSpaces === bNoSpaces) return true;
                                    
                                    if (Math.abs(a.length - b.length) > 1) return false;
                                    
                                    let differences = 0;
                                    let i = 0, j = 0;
                                    while (i < a.length && j < b.length) {
                                        if (a[i] !== b[j]) {
                                            differences++;
                                            if (differences > 1) return false;
                                            if (a.length > b.length) i++;
                                            else if (b.length > a.length) j++;
                                            else { i++; j++; }
                                        } else {
                                            i++;
                                            j++;
                                        }
                                    }
                                    return differences + (a.length - i) + (b.length - j) <= 1;
                                };
                                
                                if (isAlmostIdentical(normalizedTrackAlbum, normalizedPlayAlbum) || 
                                    isHamiltonMatch(normalizedPlayAlbum, normalizedTrackAlbum)) {
                                    const artistName = track["Artist"] || track["Artist Name"] || track["artist"];
                                    if (varExists(artistName) && artistName.length > 0) {
                                        return artistName;
                                    } else {
                                        debugger;
                                    }
                                }
                            }
                        }
                    }

                    // No album match found among multiple tracks - return Unknown Artist
                }
            }
        }


        // Fallback if not found
        if (!Computation._unknownArtistWarningLogged) {
            console.warn('Artist name not found in library for song:', play["Song Name"]);
            Computation._unknownArtistWarningLogged = true;
        }

        return "Unknown Artist";
    }
    static isSamePlay(play, previousPlay) {
        // Since CSV has no artist info, we compare by song name and position only.
        // This is sufficient for detecting paused/resumed plays because:
        // 1. We check exact position matching (End Position = Start Position)
        // 2. We check the pause reason (PLAYBACK_MANUALLY_PAUSED)
        // 3. These are consecutive records in time
        // The combination of these factors makes false positives (different songs with same name)
        // extremely unlikely in practice.
        if (previousPlay != null &&
            Computation.isPlay(previousPlay) && 
            Computation.isPlay(play) &&
            previousPlay["Song Name"] === play["Song Name"] &&
            previousPlay["End Position In Milliseconds"] === play["Start Position In Milliseconds"] &&
            previousPlay["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED") {
            return true;
        } else {
            return false;
        }
    }

    static isSamePlayNext(play, nextPlay) {
        // Since CSV has no artist info, we compare by song name and position only.
        // This is sufficient for detecting paused/resumed plays because:
        // 1. We check exact position matching (End Position = Start Position)
        // 2. We check the pause reason (PLAYBACK_MANUALLY_PAUSED)
        // 3. These are consecutive records in time
        // The combination of these factors makes false positives (different songs with same name)
        // extremely unlikely in practice.
        if (nextPlay != null &&
            Computation.isPlay(nextPlay) && 
            Computation.isPlay(play) &&
            nextPlay["Song Name"] === play["Song Name"] &&
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
        debugger;
        let unknownArtistTracks = []; // Add this tracking array
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
        var albums = {};
        var yearSongs = {};
        var yearArtists = {};
        var yearAlbums = {};
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
                    if (artistName === "Unknown Artist") {
                            unknownArtistTracks.push({
                                songName: play["Song Name"],
                                playDuration: play["Play Duration Milliseconds"],
                                mediaDuration: play["Media Duration In Milliseconds"],
                                playCount: play["Track Play Count"],
                                timestamp: play["Event End Timestamp"]
                            });
                        }
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
    
    
                        var missedMilliseconds = 0;
    
                        // Only calculate missed time for the final segment of a song
                        // Set to 0 if this segment will continue (will be resumed next)
                        if (Computation.isSamePlayNext(play, data[index+1])) {
                            // This play will be resumed, so don't count missed time yet
                            missedMilliseconds = 0;
                        } else {
                            // This is the final segment (either standalone or last of a resumed series)
                            // Calculate missed time accounting for where the play ended
                            var startPosition = Number(play["Start Position In Milliseconds"]) || 0;
                            var playDuration = Number(play["Play Duration Milliseconds"]);
                            var mediaDuration = Number(play["Media Duration In Milliseconds"]);
                            var endPosition = startPosition + playDuration;
                            
                            // Missed time is what's left unplayed after this segment
                            missedMilliseconds = Math.max(0, mediaDuration - endPosition);
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

                            // Track albums
                            var albumName = play["Album Name"];
                            if (varExists(albumName) && albumName.length > 0) {
                                if (albums[albumName] == null) {
                                    albums[albumName] = {
                                        plays: 0,
                                        time: 0,
                                        missedTime: 0
                                    };
                                }

                                if (!Computation.isSamePlay(play, previousPlay)) {
                                    albums[albumName].plays = albums[albumName].plays + 1;
                                }

                                albums[albumName].time = Number(albums[albumName].time) + Number(play["Play Duration Milliseconds"]);
                                albums[albumName].missedTime = Number(albums[albumName].missedTime) + missedMilliseconds;
                            }
    
    
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
    
                            // Track artists per year
                            if (yearArtists[yearID] == null) {
                                yearArtists[yearID] = {};
                            }
    
                            if (yearArtists[yearID][artistName] == null) {
                                yearArtists[yearID][artistName] = {
                                    plays: 0,
                                    time: 0,
                                    missedTime: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                yearArtists[yearID][artistName].plays = yearArtists[yearID][artistName].plays + 1;
                            }
                            yearArtists[yearID][artistName].time = Number(yearArtists[yearID][artistName].time) + Number(play["Play Duration Milliseconds"]);
                            yearArtists[yearID][artistName].missedTime = Number(yearArtists[yearID][artistName].missedTime) + missedMilliseconds;

                            // Track albums per year
                            if (varExists(albumName) && albumName.length > 0) {
                                if (yearAlbums[yearID] == null) {
                                    yearAlbums[yearID] = {};
                                }

                                if (yearAlbums[yearID][albumName] == null) {
                                    yearAlbums[yearID][albumName] = {
                                        plays: 0,
                                        time: 0,
                                        missedTime: 0
                                    };
                                }

                                if (!Computation.isSamePlay(play, previousPlay)) {
                                    yearAlbums[yearID][albumName].plays = yearAlbums[yearID][albumName].plays + 1;
                                }
                                yearAlbums[yearID][albumName].time = Number(yearAlbums[yearID][albumName].time) + Number(play["Play Duration Milliseconds"]);
                                yearAlbums[yearID][albumName].missedTime = Number(yearAlbums[yearID][albumName].missedTime) + missedMilliseconds;
                            }
    
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
            matchResults: matchResults
        }

        console.log("Tracks with 'Unknown Artist':", unknownArtistTracks);
        callback(returnVal);
        console.log(returnVal);

        // return 
    }
}

export default Computation;
