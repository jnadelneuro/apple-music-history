import React from 'react';

/**
 * Shared controls for the analytical views: a "Top X" size input and
 * multi-select year chips (any subset, non-consecutive allowed).
 */
function ControlsBar({ topX, onTopX, years, selectedYears, onToggleYear, onAllYears, onNoneYears }) {
    const selected = new Set(selectedYears.map(String));
    return (
        <div className="amh-controls">
            <label className="amh-topx">
                Top
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={topX}
                    onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        onTopX(isNaN(v) ? 1 : Math.min(100, Math.max(1, v)));
                    }}
                />
            </label>

            <div className="amh-chips">
                {years.map((y) => (
                    <button
                        key={y}
                        className={'amh-chip' + (selected.has(String(y)) ? ' is-on' : '')}
                        onClick={() => onToggleYear(y)}
                    >
                        {y}
                    </button>
                ))}
                <button className="amh-chip amh-chip--action" onClick={onAllYears}>All</button>
                <button className="amh-chip amh-chip--action" onClick={onNoneYears}>None</button>
            </div>
        </div>
    );
}

export default ControlsBar;
