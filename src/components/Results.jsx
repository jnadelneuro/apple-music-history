import React, { Component } from 'react';
import Computation from "./Computation";
import Dashboard from "./Dashboard";

class Results extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: props.data,
            libraryData: props.libraryData,
            dailyTracksData: props.dailyTracksData,
            excludedSongs: [],
            results: null
        };
        this.toggleExcluded = this.toggleExcluded.bind(this);
        this.clearExcluded = this.clearExcluded.bind(this);
    }

    componentDidMount() {
        this.recompute(this.state.excludedSongs);
    }

    recompute(excludedSongs) {
        setTimeout(() => {
            Computation.calculateTop(this.state.data, excludedSongs, (results) => {
                this.setState({ results, excludedSongs });
            }, this.state.libraryData, this.state.dailyTracksData);
        }, 0);
    }

    toggleExcluded(key) {
        let excludedSongs = this.state.excludedSongs.slice();
        if (excludedSongs.includes(key)) {
            excludedSongs = excludedSongs.filter((k) => k !== key);
        } else {
            excludedSongs.push(key);
        }
        this.recompute(excludedSongs);
    }

    clearExcluded() {
        this.recompute([]);
    }

    render() {
        const { results } = this.state;

        if (results == null) {
            return (
                <div>
                    <h4 style={{ textAlign: 'center' }}>Loading...</h4>
                    <div className="sk-fading-circle">
                        <div className="sk-circle1 sk-circle"></div>
                        <div className="sk-circle2 sk-circle"></div>
                        <div className="sk-circle3 sk-circle"></div>
                        <div className="sk-circle4 sk-circle"></div>
                        <div className="sk-circle5 sk-circle"></div>
                        <div className="sk-circle6 sk-circle"></div>
                        <div className="sk-circle7 sk-circle"></div>
                        <div className="sk-circle8 sk-circle"></div>
                        <div className="sk-circle9 sk-circle"></div>
                        <div className="sk-circle10 sk-circle"></div>
                        <div className="sk-circle11 sk-circle"></div>
                        <div className="sk-circle12 sk-circle"></div>
                    </div>
                </div>
            );
        }

        if (results.songs.length <= 1) {
            return (
                <div className="errorDiv box">There was an error processing your data <span role="img" aria-label="sad face emoji">☹️</span> , please double check the loaded file is correct: "<em>Apple Music Play Activity.<strong>csv</strong></em>".<br />For more help please follow this helpful <a href="https://www.macrumors.com/2018/11/29/web-app-apple-music-history/">guide from MacRumors</a>.
                    <br /><br /><a href="http://music.patmurray.co">Reload Page...</a></div>
            );
        }

        return (
            <Dashboard
                results={results}
                excludedSongs={this.state.excludedSongs}
                toggleExcluded={this.toggleExcluded}
                clearExcluded={this.clearExcluded}
            />
        );
    }
}

export default Results;
