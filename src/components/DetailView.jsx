import React, { useMemo } from 'react';
import numeral from 'numeral';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';

import ArtistResolver from './ArtistResolver';
import Computation from './Computation';
import { computeEntityDetail } from './detail';

function Stat({ label, value }) {
    return (
        <div className="amh-stat">
            <div className="amh-stat__value">{value}</div>
            <div className="amh-stat__label">{label}</div>
        </div>
    );
}

function Bars({ title, items }) {
    const max = Math.max(1, ...items.map((i) => i.plays));
    return (
        <div className="amh-card">
            <h3 className="amh-card__title">{title}</h3>
            <div className="amh-bars">
                {items.map((i) => (
                    <div className="amh-bar" key={i.label} title={`${i.plays} plays · ${Computation.convertTime(i.time)}`}>
                        <span className="amh-bar__label">{i.label}</span>
                        <span className="amh-bar__track">
                            <span className="amh-bar__fill" style={{ width: `${(i.plays / max) * 100}%` }} />
                        </span>
                        <span className="amh-bar__val">{i.plays}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const fmtDate = (d) => (d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

function DetailView({ data, libraryData, dailyTracksData, entity, onBack }) {
    const resolver = useMemo(() => new ArtistResolver(libraryData, dailyTracksData), [libraryData, dailyTracksData]);
    const detail = useMemo(() => computeEntityDetail(data, resolver, entity), [data, resolver, entity]);

    const title = entity.type === 'song' ? entity.name : (entity.artist || entity.album || entity.key);
    const typeLabel = entity.type === 'song' ? entity.artist : (entity.type === 'artist' ? 'Artist' : 'Album');

    const dateValues = Object.entries(detail.dates).map(([date, count]) => ({ date, count }));
    const maxDate = Math.max(1, ...dateValues.map((v) => v.count));

    return (
        <div>
            <button className="amh-btn" onClick={onBack} style={{ marginBottom: 16 }}>← Back to search</button>

            <div className="amh-detail-head">
                <div className="amh-detail-head__type">{typeLabel}</div>
                <h2 className="amh-detail-head__title">{title}</h2>
                <div className="amh-detail-stats">
                    <Stat label="Plays" value={numeral(detail.plays).format('0,0')} />
                    <Stat label="Time listened" value={Computation.convertTime(detail.time) || '0s'} />
                    <Stat label="Time skipped" value={Computation.convertTime(detail.missedTime) || '0s'} />
                    <Stat label="First played" value={fmtDate(detail.first)} />
                    <Stat label="Last played" value={fmtDate(detail.last)} />
                </div>
            </div>

            {detail.plays === 0 ? (
                <div className="amh-empty">No qualifying plays found for this {entity.type}.</div>
            ) : (
                <div>
                    <div className="amh-cols amh-cols--2">
                        <Bars title="By Year" items={detail.years} />
                        <Bars title="By Month" items={detail.months} />
                    </div>
                    <div className="amh-cols amh-cols--2">
                        <Bars title="By Day of Week" items={detail.dows} />
                        <Bars title="By Hour of Day" items={detail.hours} />
                    </div>
                    <div className="box">
                        <h3>Listening dates</h3>
                        <CalendarHeatmap
                            startDate={detail.first}
                            endDate={detail.last}
                            values={dateValues}
                            showWeekdayLabels={true}
                            titleForValue={(v) => (v && v.date ? `${Computation.convertTime(v.count)} on ${v.date}` : '')}
                            tooltipDataAttrs={(v) => (v && v.date ? { 'data-tip': `${Computation.convertTime(v.count)} on ${v.date}` } : { 'data-tip': '' })}
                            classForValue={(v) => {
                                if (!v) return 'color-empty';
                                const n = Math.ceil((v.count / maxDate * 100) / 10) * 10;
                                return `color-scale-${n}`;
                            }}
                        />
                        <ReactTooltip />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DetailView;
