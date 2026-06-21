import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import Banner from './Banner';

const HEADER = 'Song Name,Album Name,Play Duration Milliseconds,Media Duration In Milliseconds,Start Position In Milliseconds,End Position In Milliseconds,Event End Timestamp,End Reason Type,UTC Offset In Seconds,Item Type,Media Type';

function csvFile(rows) {
    const csv = [HEADER, ...rows].join('\n') + '\n';
    return new File([csv], 'play.csv', { type: 'text/csv' });
}

const flush = () => new Promise((r) => setTimeout(r, 30));

it('Generate is disabled until a Play Activity file is chosen', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    act(() => { ReactDOM.render(<Banner dataResponseHandler={() => {}} />, div); });
    const button = div.querySelector('button');
    expect(button.textContent).toContain('Generate report');
    expect(button.disabled).toBe(true);
    act(() => { ReactDOM.unmountComponentAtNode(div); });
    document.body.removeChild(div);
});

it('parses the selected Play Activity rows and caps inflated durations', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let received = null;
    let banner = null;
    act(() => {
        ReactDOM.render(<Banner ref={(b) => { banner = b; }} dataResponseHandler={(d) => { received = d; }} />, div);
    });

    // A normal play and one with an absurd (stuck-timer) duration to be capped.
    const file = csvFile([
        'Hello,25,200000,295000,0,200000,2022-01-01T10:00:00Z,NATURAL_END_OF_TRACK,0,ITUNES_STORE_CONTENT,AUDIO',
        'Glitch,X,9000000,200000,0,200000,2022-01-02T10:00:00Z,NATURAL_END_OF_TRACK,0,ITUNES_STORE_CONTENT,AUDIO'
    ]);

    act(() => { banner.setState({ playFile: file }); });
    await act(async () => { await banner.handleGenerate(); await flush(); });

    expect(received).not.toBeNull();
    expect(received.length).toBe(2);              // both rows parsed (the data[0] bug would yield 0)
    expect(received[0]['Song Name']).toBe('Hello');
    expect(received[1]['Play Duration Milliseconds']).toBe('200000'); // capped at media duration

    act(() => { ReactDOM.unmountComponentAtNode(div); });
    document.body.removeChild(div);
});
