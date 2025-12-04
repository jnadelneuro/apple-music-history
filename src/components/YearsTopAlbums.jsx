import React, { Component } from 'react';
import YearAlbumsCollapse from './yearalbumscollapse';

class YearsTopAlbums extends Component {

    constructor(props) {
        super(props);
        this.state = {
            yearAlbums: props.yearAlbums,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            yearAlbums: nextProps.yearAlbums
        });
    }

    render() {

        var yearsBoxes = [];
        for (let index = 0; index < this.state.yearAlbums.length; index++) {
            const year = this.state.yearAlbums[index];
            yearsBoxes.push(<YearAlbumsCollapse year={year} key={year.key + "-albums"} />);
        }



        return (yearsBoxes);

    }

}

export default YearsTopAlbums;
