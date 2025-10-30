// Quick test of parseSchedule normalization and regex behavior

function parseSchedule(scheduleText) {
    if (!scheduleText || typeof scheduleText !== 'string') {
        return null;
    }

    // Normalize input: remove dots from AM/PM, unify dashes, collapse whitespace
    const normalized = scheduleText.toLowerCase()
        .replace(/\./g, '')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

    const text = normalized;

    // Handle 24/7 locations
    if (text.includes('24/7') || text.includes('24 hours') || text.includes('always open')) {
        return { type: 'always' };
    }

    // Handle "by appointment"
    if (text.includes('appointment') || text.includes('call first') || text.includes('contact')) {
        return { type: 'appointment' };
    }

    // Monthly patterns (unchanged)
    const ordinalToken = '(?:first|1st|second|2nd|third|3rd|fourth|4th|last)';
    const multiOrdinalPattern = new RegExp('\\b(' + ordinalToken + '(?:\\s*(?:&|and|,|and the)\\s*' + ordinalToken + ')*)\\b[^\\n]{0,20}\\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\\b', 'i');
    const m = text.match(multiOrdinalPattern);
    if (m) {
        const ordinalsRaw = m[1];
        const weekday = m[2].toLowerCase();
        const parts = ordinalsRaw.split(/(?:\\s*(?:&|and|,|and the)\\s*)/i).map(s => s.trim()).filter(Boolean);
        const ordinals = parts.map(tok => {
            tok = tok.toLowerCase();
            if (tok.startsWith('1') || tok.startsWith('first')) return 1;
            if (tok.startsWith('2') || tok.startsWith('second')) return 2;
            if (tok.startsWith('3') || tok.startsWith('third')) return 3;
            if (tok.startsWith('4') || tok.startsWith('fourth')) return 4;
            if (tok.startsWith('last')) return -1;
            return null;
        }).filter(n => n !== null);
        if (ordinals.length > 0) {
            return { type: 'monthly', original: scheduleText, weekday: weekday, ordinals: ordinals };
        }
    }

    if (text.includes('first of each month') || text.includes('monthly') || text.includes('of each month')) {
        return { type: 'monthly', original: scheduleText };
    }

    const schedule = { type: 'scheduled', dayTimes: {} };

    const dayPatterns = {
        'monday': ['monday', 'mon'],
        'tuesday': ['tuesday', 'tues', 'tue'],
        'wednesday': ['wednesday', 'wed'],
        'thursday': ['thursday', 'thurs', 'thu'],
        'friday': ['friday', 'fri'],
        'saturday': ['saturday', 'sat'],
        'sunday': ['sunday', 'sun']
    };

    const parts = text.split(',').map(part => part.trim());
    let hasDaySpecific = false;
    let totalDaysCount = 0;
    let partsWithTimes = 0;

    // Flexible time regex: expects normalized text (dots removed, dashes unified)
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/g;

    parts.forEach(part => {
        let partDays = 0;
        let partTimes = 0;

        Object.keys(dayPatterns).forEach(day => {
            const patterns = dayPatterns[day];
            if (patterns.some(pattern => part.includes(pattern))) {
                partDays++;
                totalDaysCount++;
            }
        });

        // Reset lastIndex because we're using a global regex
        timeRegex.lastIndex = 0;
        if (timeRegex.test(part)) {
            partsWithTimes++;
            partTimes = 1;
        }

        if (partDays === 1 && partTimes === 1) {
            hasDaySpecific = true;
        }
    });

    const isSharedSchedule = partsWithTimes === 1 && totalDaysCount > 1;
    if (isSharedSchedule) {
        hasDaySpecific = false;
    }

    if (hasDaySpecific) {
        parts.forEach(part => {
            let foundDays = [];
            let timeRanges = [];

            Object.keys(dayPatterns).forEach(day => {
                const patterns = dayPatterns[day];
                if (patterns.some(pattern => part.includes(pattern))) {
                    foundDays.push(day);
                }
            });

            timeRegex.lastIndex = 0;
            let match;
            while ((match = timeRegex.exec(part)) !== null) {
                const startHour = parseInt(match[1]);
                const startMinute = match[2] ? parseInt(match[2]) : 0;
                const startPeriod = match[3];
                const endHour = match[4] ? parseInt(match[4]) : null;
                const endMinute = match[5] ? parseInt(match[5]) : 0;
                const endPeriod = match[6];

                let start24 = startHour;
                if (startPeriod === 'pm' && startHour !== 12) start24 += 12;
                if (startPeriod === 'am' && startHour === 12) start24 = 0;

                let end24;
                if (endHour !== null) {
                    end24 = endHour;
                    if (endPeriod === 'pm' && endHour !== 12) end24 += 12;
                    if (endPeriod === 'am' && endHour === 12) end24 = 0;
                } else {
                    end24 = start24 + 4;
                }

                timeRanges.push({ start: start24 * 60 + startMinute, end: end24 * 60 + (endHour === null ? 0 : endMinute) });
            }

            if (timeRanges.length > 0) {
                foundDays.forEach(day => {
                    schedule.dayTimes[day] = timeRanges;
                });
            }
        });
    } else {
        const allDays = [];
        const allTimes = [];

        Object.keys(dayPatterns).forEach(day => {
            const patterns = dayPatterns[day];
            if (patterns.some(pattern => text.includes(pattern))) {
                allDays.push(day);
            }
        });

        if (allDays.length === 0) {
            allDays.push('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
        }

        timeRegex.lastIndex = 0;
        let match;
        while ((match = timeRegex.exec(text)) !== null) {
            const startHour = parseInt(match[1]);
            const startMinute = match[2] ? parseInt(match[2]) : 0;
            const startPeriod = match[3];
            const endHour = match[4] ? parseInt(match[4]) : null;
            const endMinute = match[5] ? parseInt(match[5]) : 0;
            const endPeriod = match[6];

            let start24 = startHour;
            if (startPeriod === 'pm' && startHour !== 12) start24 += 12;
            if (startPeriod === 'am' && startHour === 12) start24 = 0;

            let end24;
            if (endHour !== null) {
                end24 = endHour;
                if (endPeriod === 'pm' && endHour !== 12) end24 += 12;
                if (endPeriod === 'am' && endHour === 12) end24 = 0;
            } else {
                end24 = start24 + 4;
            }

            allTimes.push({ start: start24 * 60 + startMinute, end: end24 * 60 + (endHour === null ? 0 : endMinute) });
        }

        allDays.forEach(day => {
            schedule.dayTimes[day] = allTimes;
        });
    }

    if (Object.keys(schedule.dayTimes).length === 0 || Object.values(schedule.dayTimes).every(times => times.length === 0)) {
        return { type: 'unknown', original: scheduleText };
    }

    return schedule;
}

// Quick test
const examples = [
    'Thursdays, 9 a.m.–12 p.m.',
    'Thursdays, 9 am - 12 pm',
    'Wednesdays 5:00 PM - 7:00 PM',
    '24/7 access',
    'Second Saturday of each month'
];

examples.forEach(ex => {
    console.log('INPUT:', ex);
    console.log('PARSED:', JSON.stringify(parseSchedule(ex), null, 2));
    console.log('---');
});
