import React from 'react';
import numeral from 'numeral';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import HeatMap from 'react-heatmap-grid';

import MonthChart from './MonthChart';
import ReasonsBox from './ReasonsBox';
import Computation from './Computation';

const xLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
const xLabelsVisibility = [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false];
const yLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

function TrendsView({ results }) {
    const days = results.days;

    const heatmapData = [];
    let firstDay = new Date();
    let maxValue = 0;
    let lastDate = new Date('2015-01-01T01:00:00');
    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        heatmapData.push({ date: day.key, count: day.value.time });
        if (day.value.time > maxValue) maxValue = day.value.time;
        if (new Date(day.key) < firstDay) firstDay = new Date(day.key);
        if (new Date(day.key) > lastDate) lastDate = new Date(day.key);
    }
    const daysTodayCount = Math.round((lastDate - firstDay) / (1000 * 60 * 60 * 24));
    const dayswithoutmusic = daysTodayCount - days.length;

    return (
        <div>
            <MonthChart months={results.months} />

            <div className="box">
                <h3>Playing Time by Date</h3>
                <CalendarHeatmap
                    startDate={firstDay}
                    endDate={lastDate}
                    values={heatmapData}
                    showWeekdayLabels={true}
                    titleForValue={(value) => (value && value.date != null ? `${Computation.convertTime(value.count)} on ${value.date}` : '')}
                    tooltipDataAttrs={(value) => (value && value.date != null ? { 'data-tip': `${Computation.convertTime(value.count)} on ${value.date}` } : { 'data-tip': '' })}
                    classForValue={(value) => {
                        if (!value) return 'color-empty';
                        const number = Math.ceil((value.count / maxValue * 100) / 10) * 10;
                        return `color-scale-${number}`;
                    }}
                />
                <ReactTooltip />
                <p>There were <strong>{numeral(dayswithoutmusic).format('0,0')}</strong> out of <strong>{numeral(daysTodayCount).format('0,0')}</strong> days you didn't listen to music.</p>
            </div>

            <div className="box">
                <h3>Playing Time by Hour of Day</h3>
                <HeatMap
                    squares={true}
                    xLabelsVisibility={xLabelsVisibility}
                    xLabels={xLabels}
                    yLabels={yLabels}
                    data={results.hoursArray}
                />
            </div>

            <ReasonsBox reasons={results.reasons} />
        </div>
    );
}

export default TrendsView;
