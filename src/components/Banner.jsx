import React, { Component } from 'react';
import { Jumbotron, Button } from 'reactstrap';
import Papa from 'papaparse';

// Only these columns from Play Activity are needed for the report. Projecting
// to them while streaming keeps even the full (~300 MB, 100+ column) export
// light in memory. (See scripts/trim-play-activity.js to pre-trim on disk for
// much faster loading.)
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
            processing: false,
            progress: 0,
            playFile: null,
            libraryFile: null,
            dailyFile: null
        };
    }

    parseLibrary(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    resolve(JSON.parse(e.target.result));
                } catch (err) {
                    alert('Error reading library JSON file:\n\n' + err.message + '\n\nPlease make sure you uploaded a valid JSON file.');
                    resolve(null);
                }
            };
            reader.onerror = () => resolve(null);
            reader.readAsText(file);
        });
    }

    parseDaily(file) {
        return new Promise((resolve) => {
            const rows = [];
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                step: (results) => {
                    const row = results.data;
                    if (row && row["Track Description"]) {
                        rows.push({ "Track Description": row["Track Description"] });
                    }
                },
                complete: () => resolve(rows),
                error: (err) => {
                    alert('Error reading Daily Tracks CSV:\n\n' + err.message);
                    resolve(null);
                }
            });
        });
    }

    parsePlayActivity(file) {
        return new Promise((resolve, reject) => {
            const data = [];
            // <input type="date"> gives "YYYY-MM-DD" -> ISO prefix for timestamp compare.
            const filterDateRaw = document.getElementById("filterDate").value;
            const filterDate = filterDateRaw ? filterDateRaw + "T00:00:00" : "";

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                step: (results) => {
                    const row = results.data;
                    if (!row || !row["Song Name"]) return;

                    if (filterDate && (row["Event End Timestamp"] || "") < filterDate) return;

                    // Project to only the needed columns to keep memory bounded.
                    const slim = {};
                    for (let i = 0; i < PLAY_ACTIVITY_COLUMNS.length; i++) {
                        const col = PLAY_ACTIVITY_COLUMNS[i];
                        slim[col] = row[col];
                    }

                    // Apple occasionally logs a Play Duration far longer than the track
                    // itself (a stuck timer), which inflates listen-time totals. You can't
                    // play more of a track than its length in one play, so cap it.
                    const media = Number(slim["Media Duration In Milliseconds"]);
                    const dur = Number(slim["Play Duration Milliseconds"]);
                    if (media > 0 && dur > media) {
                        slim["Play Duration Milliseconds"] = String(media);
                    }

                    data.push(slim);
                    if (data.length % 50000 === 0) {
                        this.setState({ progress: data.length });
                    }
                },
                complete: () => resolve(data),
                error: (err) => reject(err)
            });
        });
    }

    handleGenerate = async () => {
        if (!this.state.playFile || this.state.processing) return;
        this.setState({ processing: true, progress: 0 });
        try {
            const libraryData = this.state.libraryFile ? await this.parseLibrary(this.state.libraryFile) : null;
            const dailyTracksData = this.state.dailyFile ? await this.parseDaily(this.state.dailyFile) : null;
            const data = await this.parsePlayActivity(this.state.playFile);
            this.props.dataResponseHandler(data, libraryData, dailyTracksData);
        } catch (err) {
            console.error('CSV parsing error:', err);
            alert('Error reading Play Activity CSV:\n\n' + err.message);
            this.setState({ processing: false });
        }
    }

    fileLabel(file) {
        return file
            ? <p style={{ color: 'green', marginTop: '8px', marginBottom: 0 }}>✅ Selected: {file.name}</p>
            : null;
    }

    render() {
        const { processing, progress, playFile, libraryFile, dailyFile } = this.state;

        return (
            <div>
                <Jumbotron>
                    <h1 className="display-3">Apple Music Analyser</h1>
                    <p className="lead">Choose your Apple Music files below, then click <strong>Generate report</strong>. The order you pick them in doesn't matter.</p>
                    <hr className="my-2" />
                    <p>No data ever leaves your computer and all computation is done in the browser.</p>

                    <div className="box" style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107', padding: '15px', marginBottom: '20px' }}>
                        <h5>📊 Play Activity (Required)</h5>
                        <p>Choose your <strong>Apple Music Play Activity.csv</strong> — your full per-play history with precise listen and skip times.</p>
                        <p style={{ fontSize: '0.9em', color: '#555' }}>Loading slowly? The raw file can be huge. Run <code>node scripts/trim-play-activity.js "path/to/Apple Music Play Activity.csv"</code> first to shrink it to just the needed columns for much faster loading.</p>
                        <div style={{ marginBottom: '12px' }}>
                            <p>To limit the report's start (e.g. only 2021 onward), set a date below; leave blank for all data.</p>
                            Choose date: <input id="filterDate" type="date" disabled={processing} />
                        </div>
                        <input
                            id="file"
                            name="file"
                            className="inputfile"
                            type="file"
                            accept=".csv"
                            disabled={processing}
                            onChange={(e) => this.setState({ playFile: e.target.files[0] || null })}
                        />
                        {this.fileLabel(playFile)}
                    </div>

                    <div className="box" style={{ backgroundColor: '#d1ecf1', borderColor: '#bee5eb', padding: '15px', marginBottom: '20px' }}>
                        <h5>📁 Library (recommended — for artist names)</h5>
                        <p>Play Activity has no artist column, so choose your <strong>Apple Music Library Tracks.json</strong> to recover artists (matched by song + album). Without it, many songs show as "Unknown Artist".</p>
                        <input
                            id="libraryFile"
                            name="libraryFile"
                            type="file"
                            accept=".json"
                            disabled={processing}
                            onChange={(e) => this.setState({ libraryFile: e.target.files[0] || null })}
                        />
                        {this.fileLabel(libraryFile)}
                    </div>

                    <div className="box" style={{ backgroundColor: '#e2e3e5', borderColor: '#d6d8db', padding: '15px', marginBottom: '20px' }}>
                        <h5>🎯 Play History Daily Tracks (optional — better artist coverage)</h5>
                        <p>Optionally add <strong>Apple Music - Play History Daily Tracks.csv</strong>. It names the artist for everything you streamed, filling in artists the library misses.</p>
                        <input
                            id="dailyFile"
                            name="dailyFile"
                            type="file"
                            accept=".csv"
                            disabled={processing}
                            onChange={(e) => this.setState({ dailyFile: e.target.files[0] || null })}
                        />
                        {this.fileLabel(dailyFile)}
                    </div>

                    <Button color="danger" size="lg" disabled={!playFile || processing} onClick={this.handleGenerate}>
                        {processing ? 'Processing…' : 'Generate report'}
                    </Button>
                    {!playFile && !processing && (
                        <p style={{ marginTop: '10px', color: '#856404' }}>Choose your Play Activity file to enable this.</p>
                    )}
                    {processing && (
                        <p style={{ marginTop: '10px' }}>
                            Reading your data… {progress > 0 ? `${progress.toLocaleString()} plays so far` : 'starting up'} — large files take a moment.
                        </p>
                    )}
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
