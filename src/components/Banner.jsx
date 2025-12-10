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

class Banner extends Component {

    constructor(props) {
        super(props);
        this.state = { 
            loading: false,
            libraryData: null,
            csvData: null
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

    handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        let data = [];
        const filterDate = document.getElementById("filterDate").value;
        let filteredCount = 0;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // The step function receives a 'results' object where 'data' is an ARRAY of rows
            step: (results) => {
                // Fix: Extract the first item from the array
                const row = results.data[0];
                
                // Guard clause in case empty row slips through
                if (!row) return;

                // Apply intelligent duration filtering to fix data anomalies
                // If Play Duration exceeds Media Duration significantly, cap it at Media Duration
                const mediaDuration = Number(row["Media Duration In Milliseconds"]);
                const playDuration = Number(row["Play Duration Milliseconds"]);
                
                if (mediaDuration > 0 && playDuration > 0) {
                    // If play duration exceeds media duration by more than 50% (allowing for small errors/crossfade)
                    // This catches cases where timers got stuck or paused time was incorrectly logged
                    if (playDuration > mediaDuration * 1.5) {
                        // Log the anomaly for debugging (only first few to avoid console spam)
                        if (filteredCount < 5) {
                            console.log('⚠️ Duration anomaly detected and corrected:', {
                                song: row["Song Name"],
                                originalPlayDuration: playDuration,
                                mediaDuration: mediaDuration,
                                ratio: (playDuration / mediaDuration).toFixed(2) + 'x'
                            });
                        }
                        
                        // Cap the play duration at the media duration
                        row["Play Duration Milliseconds"] = mediaDuration.toString();
                        filteredCount++;
                    }
                }

                // Filter on the fly if needed
                if (filterDate.length > 1) {
                    if (row["Event End Timestamp"] >= filterDate + "T00:00:00" || 
                        row["Event Start Timestamp"] >= filterDate + "T00:00:00") {
                        data.push(row);
                    }
                } else {
                    data.push(row);
                }
                
                // Log progress every 50000 rows
                if (data.length % 50000 === 0) {
                    console.log('Processed:', data.length, 'records so far...');
                }
            },
            complete: () => {
                console.log('CSV data loaded:', data.length, 'records');
                
                // Log summary of duration filtering
                if (filteredCount > 0) {
                    console.log('✅ Duration anomalies corrected:', filteredCount, 'records had play duration capped to media duration');
                }
                
                // These logs should now work correctly
                if (data.length > 0) {
                    console.log('Column names:', Object.keys(data[0]));
                    console.log('First row sample:', data[0]);
                }
                
                if (!this.state.libraryData) {
                    console.warn('⚠️ WARNING: No library file uploaded.');
                }
                
                this.props.dataResponseHandler(data, this.state.libraryData);
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
                    
                    <div className="box" style={{backgroundColor: '#d1ecf1', borderColor: '#bee5eb', padding: '15px', marginBottom: '20px'}}>
                        <h5>📁 Step 1: Upload Library (REQUIRED for Artist Names)</h5>
                        <p><strong>Important:</strong> The CSV file does not contain artist information. You must upload your <strong>Apple Music Library Activity.json</strong> file to see artist names. Without this file, all songs will show as "Unknown Artist".</p>
                        <input 
                            id="libraryFile" 
                            name="libraryFile" 
                            type="file" 
                            accept=".json"
                            onChange={this.handleLibraryUpload}
                            style={{marginBottom: '10px'}}
                        />
                        {this.state.libraryData && (
                            <p style={{color: 'green', marginTop: '10px'}}>
                                ✅ Library loaded: {this.state.libraryData.length} tracks
                            </p>
                        )}
                        {!this.state.libraryData && (
                            <p style={{color: '#856404', marginTop: '10px', fontWeight: 'bold'}}>
                                ⚠️ No library file uploaded - artist names will not be available
                            </p>
                        )}
                    </div>

                    <div className="box" style={{backgroundColor: '#fff3cd', borderColor: '#ffc107', padding: '15px', marginBottom: '20px'}}>
                        <h5>📊 Step 2: Upload Play Activity (Required)</h5>
                        <p>Upload your <strong>Apple Music Play Activity.csv</strong> file.</p>
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

                </Jumbotron>

                <div className="box">
                    <h3>Where is the file?</h3>

                    <p>After downloading it from the privacy portal (<a href="https://privacy.apple.com">privacy.apple.com</a>). The file is at:</p>
                    <pre>App Store, iTunes Store, iBooks Store and Apple Music/App_Store_iTunes_Store_iBooks_Store_Apple_Music/Apple Music Activity/Apple Music Play Activity.csv</pre>
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
