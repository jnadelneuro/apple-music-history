import React, { Component } from 'react';
import { Jumbotron } from 'reactstrap';
import Papa from 'papaparse';

// Legacy keys list - no longer used as we now parse CSV headers dynamically
// Kept for reference of expected Apple Music CSV format
/*
const keys = [
    "Album Name",
    "Apple ID Number",
    "Apple Music Subscription",
    "Artist Name",
    "Auto Play",
    "Build Version",
    "Bundle Version",
    "Camera Option",
    "Client Build Version",
    "Client Device Name",
    "Client IP Address",
    "Client Platform",
    "Container Album Name",
    "Container Artist Name",
    "Container Global Playlist ID",
    "Container ID",
    "Container iTunes Playlist ID",
    "Container Library ID",
    "Container Name",
    "Container Origin Type",
    "Container Personalized ID",
    "Container Playlist ID",
    "Container Radio Station ID",
    "Container Radio Station Version",
    "Container Season ID",
    "Container Type",
    "Contingency",
    "Device App Name",
    "Device App Version",
    "Device Identifier",
    "Device OS Name",
    "Device OS Version",
    "Device Type",
    "Display Count",
    "Display Language",
    "Display Type",
    "End Position In Milliseconds",
    "End Reason Type",
    "Evaluation Variant",
    "Event End Timestamp",
    "Event ID",
    "Event Post Date Time",
    "Event Reason Hint Type",
    "Event Received Timestamp",
    "Event Start Timestamp",
    "Event Timestamp",
    "Event Type",
    "Feature Name",
    "Grouping",
    "House ID",
    "IP City",
    "IP Country Code",
    "IP Latitude",
    "IP Longitude",
    "IP Network",
    "IP Network Type",
    "IP Region Code",
    "Is CMA Station",
    "Is Collaborative",
    "Is Delegated",
    "Is Heatseeker Station",
    "Is Heavy Rotation Station",
    "Is Royalty",
    "Is Vocal Attenuation",
    "Item Type",
    "Key Request",
    "Lease Limit",
    "Legacy Container Name",
    "Legacy Playback ID",
    "Local Radio Station ID",
    "Local Radio Station TuneIn ID",
    "Matched Content",
    "Media Bundle App Name",
    "Media Bundle Type",
    "Media Duration In Milliseconds",
    "Media Type",
    "Metrics Client ID",
    "Milliseconds Since Play",
    "Offline",
    "Ownership Type",
    "Personalized Name",
    "Play Duration Milliseconds",
    "Provided Audio Bit Depth",
    "Provided Audio Channel",
    "Provided Audio Sample Rate",
    "Provided Bit Rate",
    "Provided Codec",
    "Provided Playback Format",
    "Provider ID",
    "Radio Format",
    "Radio Seed ID",
    "Radio Station Country",
    "Radio Station ID",
    "Radio Station Position",
    "Radio Type",
    "Radio User ID",
    "Referral ID",
    "Repeat Play",
    "Report Type",
    "Session Is Shared",
    "Shared Activity Devices-Current",
    "Shared Activity Devices-Max",
    "Shuffle Play",
    "Siri Request",
    "Song Name",
    "Source Model",
    "Source Radio Name",
    "Source Radio Type",
    "Source Type",
    "Start Position In Milliseconds",
    "Store Front Name",
    "Subscribed State",
    "Subscription Discovery Mode",
    "Use Listening History",
    "User's Audio Quality",
    "User's Playback Format",
    "UTC Offset In Seconds",
    "Vocal Attenuation Duration",
    "Vocal Attenuation Model ID"
];
*/

// Only these columns from Play Activity are needed for the report. Projecting
// to them while streaming keeps even the full (~300 MB, 100+ column) export
// light in memory, so users can upload the raw file without trimming it first.
const PLAY_ACTIVITY_COLUMNS = [
    "Song Name",
    "Album Name",
    "Play Duration Milliseconds",
    "Media Duration In Milliseconds",
    "Start Position In Milliseconds",
    "End Position In Milliseconds",
    "Event End Timestamp",
    "End Reason Type",
    "UTC Offset In Seconds",
    "Item Type",
    "Media Type"
];

class Banner extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            libraryData: null,
            dailyTracksData: null
        };
    }

    handleLibraryUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const libraryData = JSON.parse(e.target.result);
                this.setState({ libraryData });
                console.log('Library data loaded:', libraryData.length, 'tracks');
            } catch (error) {
                alert('Error reading library JSON file:\n\n' + error.message + '\n\nPlease make sure you uploaded a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    // Optional second artist source: the Play History Daily Tracks file names the
    // artist for everything actually played, covering streamed songs the library
    // (which only holds saved tracks) misses.
    handleDailyTracksUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        let rows = [];
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (results) => {
                const row = results.data[0];
                if (!row) return;
                const desc = row["Track Description"];
                if (desc) rows.push({ "Track Description": desc });
            },
            complete: () => {
                this.setState({ dailyTracksData: rows });
                console.log('Daily tracks loaded:', rows.length, 'rows (artist source)');
            },
            error: (error) => {
                alert('Error reading Daily Tracks CSV:\n\n' + error.message);
            }
        });
    }

    handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        let data = [];
        // <input type="date"> gives "YYYY-MM-DD" -> ISO prefix for timestamp compare.
        const filterDateRaw = document.getElementById("filterDate").value;
        const filterDate = filterDateRaw ? filterDateRaw + "T00:00:00" : "";

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (results) => {
                const row = results.data[0];
                if (!row) return;

                // Filter on the fly if a start date was supplied
                if (filterDate && (row["Event End Timestamp"] || "") < filterDate) {
                    return;
                }

                // Project to only the needed columns to keep memory bounded.
                const slim = {};
                for (let i = 0; i < PLAY_ACTIVITY_COLUMNS.length; i++) {
                    const col = PLAY_ACTIVITY_COLUMNS[i];
                    slim[col] = row[col];
                }
                data.push(slim);

                if (data.length % 50000 === 0) {
                    console.log('Processed:', data.length, 'records so far...');
                }
            },
            complete: () => {
                console.log('Play Activity loaded:', data.length, 'records');
                if (data.length > 0) {
                    console.log('First row sample:', data[0]);
                }
                if (!this.state.libraryData && !this.state.dailyTracksData) {
                    console.warn('⚠️ No artist source uploaded - artists will show as "Unknown Artist".');
                }
                this.props.dataResponseHandler(data, this.state.libraryData, this.state.dailyTracksData);
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                alert('Error reading CSV file:\n\n' + error.message);
            }
        });
    }

    render() {

        return (
            <div>
                <Jumbotron>
                    <h1 className="display-3">Apple Music Analyser</h1>
                    <p className="lead">Upload your Apple Music files below to generate your report.</p>
                    <hr className="my-2" />
                    <p>No data ever leaves your computer and all computation is done in the browser.</p>
                    
                    <div className="box" style={{backgroundColor: '#fff3cd', borderColor: '#ffc107', padding: '15px', marginBottom: '20px'}}>
                        <h5>📊 Step 1: Upload Play Activity (Required)</h5>
                        <p>Upload your <strong>Apple Music Play Activity.csv</strong> file — your full per-play history with precise listen and skip times. You can upload the raw file as-is; only the columns needed are read, so even very large exports stay fast.</p>
                        <div>
                            <div style={{marginBottom: '20px'}}>
                                <p>If you want to specify the start of the report, such as to only include 2021, input 01-01-2021 below. Otherwise, leave it blank to include all data.</p>
                                Choose date: <input id="filterDate" type="date" />
                            </div>
                            <input
                                id="file"
                                name="file"
                                className="inputfile"
                                type="file"
                                accept=".csv"
                                onChange={this.handleCsvUpload}
                            />
                            <p>Loading may take a moment... be patient</p>
                        </div>
                    </div>

                    <div className="box" style={{backgroundColor: '#d1ecf1', borderColor: '#bee5eb', padding: '15px', marginBottom: '20px'}}>
                        <h5>📁 Step 2: Upload Library (recommended — for artist names)</h5>
                        <p>Play Activity has no artist column, so upload your <strong>Apple Music Library Tracks.json</strong> to recover artists (matched by song + album). Albums come from Play Activity either way. Without this, many songs show as "Unknown Artist".</p>
                        <input
                            id="libraryFile"
                            name="libraryFile"
                            type="file"
                            accept=".json"
                            onChange={this.handleLibraryUpload}
                            style={{marginBottom: '10px'}}
                        />
                        {this.state.libraryData
                            ? <p style={{color: 'green', marginTop: '10px'}}>✅ Library loaded: {this.state.libraryData.length} tracks</p>
                            : <p style={{color: '#856404', marginTop: '10px', fontWeight: 'bold'}}>⚠️ No library uploaded - artists may be incomplete</p>}
                    </div>

                    <div className="box" style={{backgroundColor: '#e2e3e5', borderColor: '#d6d8db', padding: '15px', marginBottom: '20px'}}>
                        <h5>🎯 Step 3: Upload Play History Daily Tracks (optional — better artist coverage)</h5>
                        <p>Optionally add <strong>Apple Music - Play History Daily Tracks.csv</strong>. It names the artist for everything you streamed, filling in artists the library misses (saved songs only).</p>
                        <input
                            id="dailyFile"
                            name="dailyFile"
                            type="file"
                            accept=".csv"
                            onChange={this.handleDailyTracksUpload}
                            style={{marginBottom: '10px'}}
                        />
                        {this.state.dailyTracksData && (
                            <p style={{color: 'green', marginTop: '10px'}}>✅ Daily Tracks loaded: {this.state.dailyTracksData.length} rows</p>
                        )}
                    </div>

                </Jumbotron>

                <div className="box">
                    <h3>Where are the files?</h3>

                    <p>After downloading it from the privacy portal (<a href="https://privacy.apple.com">privacy.apple.com</a>). The files are in the <strong>Apple Music Activity</strong> folder:</p>
                    <pre>Apple Media Services information/Apple Music Activity/Apple Music Play Activity.csv
Apple Media Services information/Apple Music Activity/Apple Music Library Tracks.json
Apple Media Services information/Apple Music Activity/Apple Music - Play History Daily Tracks.csv</pre>
                    <p><a href="https://www.macrumors.com/2018/11/29/web-app-apple-music-history/">Follow this tutorial from MacRumors for more detailed instructions.</a></p>
                    <a href="/step1.png"><img style={{ width: '300px' }} src={"/step1.png"} alt="" /></a>
                    <a href="/step2.png"><img style={{ width: '300px' }} src={"/step2.png"} alt="" /></a>
                    <a href="/step3.png"><img style={{ width: '300px' }} src={"/step3.png"} alt="" /></a>
                </div>

                <div className="box">
                    <h3>Example Screenshots</h3>
                    <a href="/image2.png"><img style={{ width: '300px' }} src={"/image2.png"} alt="" /></a>
                    <a href="/image1.png"><img style={{ width: '300px' }} src={"/image1.png"} alt="" /></a>
                    <a href="/image3.png"><img style={{ width: '300px' }} src={"/image3.png"} alt="" /></a>
                </div>


            </div>
        );

    }
}

export default Banner;
