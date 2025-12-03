
import React, { Component } from 'react';
import Computation from "./Computation";
import { Line } from 'react-chartjs-2';

class MonthChart extends Component {

    constructor(props) {
        super(props);
        this.state = {
            months: props.months
        };
        this.chartRef = React.createRef();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ months: nextProps.months});
    }

    componentWillUnmount() {
        // Properly destroy chart instance on unmount to prevent memory leaks
        if (this.chartRef.current && this.chartRef.current.chartInstance) {
            this.chartRef.current.chartInstance.destroy();
        }
    }

    render() {
        const chartData = Computation.convetrData(this.state.months);
        const options = {
            responsive: true,
            maintainAspectRatio: true,
            elements: {
                line: {
                    tension: 0.3 // bezierCurveTension equivalent
                },
                point: {
                    radius: 0 // pointDot: false equivalent
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        return (<div className="box linechart">
            <h3>Playing Time by Month</h3>
            <Line ref={this.chartRef} data={chartData} options={options} />
            <p>
                Orange line: hours playing // Green line: hours 'skipped'
        </p>
        </div>);

    }

}

export default MonthChart;