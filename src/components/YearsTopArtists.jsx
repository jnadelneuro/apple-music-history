import React, { Component } from 'react';
import YearArtistsCollapse from './yearartistscollapse';

class YearsTopArtists extends Component {

    constructor(props) {
        super(props);
        this.state = {
            yearArtists: props.yearArtists,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            yearArtists: nextProps.yearArtists
        });
    }

    render() {

        var yearsBoxes = [];
        for (let index = 0; index < this.state.yearArtists.length; index++) {
            const year = this.state.yearArtists[index];
            yearsBoxes.push(<YearArtistsCollapse year={year} key={year.key + "-artists"} />);
        }



        return (yearsBoxes);

    }

}

export default YearsTopArtists;
