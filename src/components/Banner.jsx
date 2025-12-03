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

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    alert('Error parsing CSV file:\n\n' + results.errors[0].message + '\n\nPlease make sure you uploaded a valid CSV file.');
                    return;
                }

                let data = results.data;
                
                // Log detected CSV columns for debugging
                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    console.log('CSV columns detected:', columns.length);
                    
                    // Check for artist-related columns
                    const artistColumns = columns.filter(col => 
                        col.toLowerCase().includes('artist')
                    );
                    if (artistColumns.length > 0) {
                        console.log('Artist columns found:', artistColumns);
                        
                        // Log sample artist data from first record
                        const firstRecord = data[0];
                        const sampleArtist = artistColumns.map(col => 
                            `${col}: "${firstRecord[col] || '(empty)'}"`
                        ).join(', ');
                        console.log('Sample artist data:', sampleArtist);
                    } else {
                        console.warn('WARNING: No artist columns detected in CSV. Songs may show as "Unknown Artist".');
                    }
                }
                
                const filterDate = document.getElementById("filterDate").value;

                if (filterDate.length > 1) {
                    var tempArray = [];
                    for(var i = 0; i < data.length; i++) {
                        if (data[i]["Event End Timestamp"] >= filterDate + "T00:00:00" || data[i]["Event Start Timestamp"] >= filterDate + "T00:00:00") {
                            tempArray.push(data[i]);                                        
                        }
                    }
                    data = tempArray;
                }

                console.log('CSV data loaded:', data.length, 'records');
                // Pass both CSV data and library data to the parent
                this.props.dataResponseHandler(data, this.state.libraryData);
            },
            error: (error) => {
                alert('Error reading CSV file:\n\n' + error.message + '\n\nPlease make sure you uploaded a valid CSV file.');
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
                        <h5>📁 Step 1: Upload Library (Optional but Recommended)</h5>
                        <p>Upload your <strong>Apple Music Library Activity.json</strong> file to enrich play data with artist information.</p>
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
