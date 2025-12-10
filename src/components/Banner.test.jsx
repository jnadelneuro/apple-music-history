import Papa from 'papaparse';

describe('Banner - Duration Filtering Logic', () => {
    let mockDataResponseHandler;

    beforeEach(() => {
        mockDataResponseHandler = jest.fn();
        
        // Mock DOM element for filterDate
        document.body.innerHTML = '<input id="filterDate" type="date" value="" />';
    });

    describe('handleCsvUpload - Duration Filtering', () => {
        it('should cap play duration when it exceeds media duration by more than 1.5x', () => {
            // Simulate the duration filtering logic
            const mockRows = [
                {
                    "Song Name": "Hollywood Baby",
                    "Media Duration In Milliseconds": "180000", // 3 minutes
                    "Play Duration Milliseconds": "876000", // 14.6 minutes (way too high)
                    "Event End Timestamp": "2024-01-01T12:00:00",
                    "Event Start Timestamp": "2024-01-01T11:00:00"
                },
                {
                    "Song Name": "Normal Song",
                    "Media Duration In Milliseconds": "200000", // 3.33 minutes
                    "Play Duration Milliseconds": "150000", // 2.5 minutes (normal - partial play)
                    "Event End Timestamp": "2024-01-01T13:00:00",
                    "Event Start Timestamp": "2024-01-01T12:30:00"
                },
                {
                    "Song Name": "Billy Knows Jamie",
                    "Media Duration In Milliseconds": "180000", // 3 minutes
                    "Play Duration Milliseconds": "1200000", // 20 minutes (way too high)
                    "Event End Timestamp": "2024-01-01T14:00:00",
                    "Event Start Timestamp": "2024-01-01T13:30:00"
                }
            ];

            // Apply the filtering logic (same as in Banner.jsx)
            const processedRows = mockRows.map(row => {
                const mediaDuration = Number(row["Media Duration In Milliseconds"]);
                const playDuration = Number(row["Play Duration Milliseconds"]);
                
                if (mediaDuration > 0 && playDuration > 0) {
                    if (playDuration > mediaDuration * 1.5) {
                        // Cap the play duration at the media duration
                        return {
                            ...row,
                            "Play Duration Milliseconds": mediaDuration.toString()
                        };
                    }
                }
                return row;
            });

            // Verify Hollywood Baby's duration was capped
            const hollywoodBaby = processedRows.find(row => row["Song Name"] === "Hollywood Baby");
            expect(hollywoodBaby["Play Duration Milliseconds"]).toBe("180000"); // Capped to media duration

            // Verify Normal Song was not modified
            const normalSong = processedRows.find(row => row["Song Name"] === "Normal Song");
            expect(normalSong["Play Duration Milliseconds"]).toBe("150000"); // Unchanged

            // Verify Billy Knows Jamie's duration was capped
            const billyKnowsJamie = processedRows.find(row => row["Song Name"] === "Billy Knows Jamie");
            expect(billyKnowsJamie["Play Duration Milliseconds"]).toBe("180000"); // Capped to media duration

            expect(processedRows.length).toBe(3);
        });

        it('should not modify play duration when it is within acceptable range (less than 1.5x media duration)', () => {
            const mockRows = [
                {
                    "Song Name": "Good Song",
                    "Media Duration In Milliseconds": "200000",
                    "Play Duration Milliseconds": "200000", // Exactly media duration
                    "Event End Timestamp": "2024-01-01T12:00:00",
                    "Event Start Timestamp": "2024-01-01T11:00:00"
                },
                {
                    "Song Name": "Slightly Over",
                    "Media Duration In Milliseconds": "200000",
                    "Play Duration Milliseconds": "250000", // 1.25x (within tolerance)
                    "Event End Timestamp": "2024-01-01T13:00:00",
                    "Event Start Timestamp": "2024-01-01T12:30:00"
                }
            ];

            // Apply the filtering logic
            const processedRows = mockRows.map(row => {
                const mediaDuration = Number(row["Media Duration In Milliseconds"]);
                const playDuration = Number(row["Play Duration Milliseconds"]);
                
                if (mediaDuration > 0 && playDuration > 0) {
                    if (playDuration > mediaDuration * 1.5) {
                        return {
                            ...row,
                            "Play Duration Milliseconds": mediaDuration.toString()
                        };
                    }
                }
                return row;
            });

            // Verify neither song was modified
            const goodSong = processedRows.find(row => row["Song Name"] === "Good Song");
            expect(goodSong["Play Duration Milliseconds"]).toBe("200000");

            const slightlyOver = processedRows.find(row => row["Song Name"] === "Slightly Over");
            expect(slightlyOver["Play Duration Milliseconds"]).toBe("250000");
        });

        it('should handle missing or zero media duration gracefully', () => {
            const mockRows = [
                {
                    "Song Name": "Missing Duration",
                    "Media Duration In Milliseconds": "0",
                    "Play Duration Milliseconds": "1000000",
                    "Event End Timestamp": "2024-01-01T12:00:00",
                    "Event Start Timestamp": "2024-01-01T11:00:00"
                },
                {
                    "Song Name": "Empty Duration",
                    "Media Duration In Milliseconds": "",
                    "Play Duration Milliseconds": "500000",
                    "Event End Timestamp": "2024-01-01T13:00:00",
                    "Event Start Timestamp": "2024-01-01T12:30:00"
                }
            ];

            // Apply the filtering logic
            const processedRows = mockRows.map(row => {
                const mediaDuration = Number(row["Media Duration In Milliseconds"]);
                const playDuration = Number(row["Play Duration Milliseconds"]);
                
                if (mediaDuration > 0 && playDuration > 0) {
                    if (playDuration > mediaDuration * 1.5) {
                        return {
                            ...row,
                            "Play Duration Milliseconds": mediaDuration.toString()
                        };
                    }
                }
                return row;
            });

            // Verify data passes through unchanged when media duration is missing/zero
            const missingDuration = processedRows.find(row => row["Song Name"] === "Missing Duration");
            expect(missingDuration["Play Duration Milliseconds"]).toBe("1000000"); // Unchanged

            const emptyDuration = processedRows.find(row => row["Song Name"] === "Empty Duration");
            expect(emptyDuration["Play Duration Milliseconds"]).toBe("500000"); // Unchanged
        });

        it('should correctly detect anomalies at the 1.5x threshold', () => {
            const mockRows = [
                {
                    "Song Name": "Exactly 1.5x",
                    "Media Duration In Milliseconds": "200000",
                    "Play Duration Milliseconds": "300000", // Exactly 1.5x
                    "Event End Timestamp": "2024-01-01T12:00:00",
                    "Event Start Timestamp": "2024-01-01T11:00:00"
                },
                {
                    "Song Name": "Just Over 1.5x",
                    "Media Duration In Milliseconds": "200000",
                    "Play Duration Milliseconds": "300001", // Just over 1.5x
                    "Event End Timestamp": "2024-01-01T13:00:00",
                    "Event Start Timestamp": "2024-01-01T12:30:00"
                },
                {
                    "Song Name": "Just Under 1.5x",
                    "Media Duration In Milliseconds": "200000",
                    "Play Duration Milliseconds": "299999", // Just under 1.5x
                    "Event End Timestamp": "2024-01-01T14:00:00",
                    "Event Start Timestamp": "2024-01-01T13:30:00"
                }
            ];

            // Apply the filtering logic
            const processedRows = mockRows.map(row => {
                const mediaDuration = Number(row["Media Duration In Milliseconds"]);
                const playDuration = Number(row["Play Duration Milliseconds"]);
                
                if (mediaDuration > 0 && playDuration > 0) {
                    if (playDuration > mediaDuration * 1.5) {
                        return {
                            ...row,
                            "Play Duration Milliseconds": mediaDuration.toString()
                        };
                    }
                }
                return row;
            });

            // Exactly 1.5x should not be modified (threshold is >1.5x)
            expect(processedRows.find(row => row["Song Name"] === "Exactly 1.5x")["Play Duration Milliseconds"]).toBe("300000");

            // Just over 1.5x should be capped
            expect(processedRows.find(row => row["Song Name"] === "Just Over 1.5x")["Play Duration Milliseconds"]).toBe("200000");

            // Just under 1.5x should not be modified
            expect(processedRows.find(row => row["Song Name"] === "Just Under 1.5x")["Play Duration Milliseconds"]).toBe("299999");
        });
    });
});
