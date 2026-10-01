export interface LyricLine {
	time: number;
	text: string;
}

export interface Track {
	id: string;
	title: string;
	artist: string;
	album: string;
	duration: number;
	/** CSS `r, g, b` used to tint the glass widget, like the extension samples from album art */
	accentRgb: string;
	/** Two colors + a glyph used to draw the generated cover art */
	art: { from: string; to: string; glyph: string };
	lines: LyricLine[];
}

/** Build timed lines from plain text, one line every `step` seconds starting at `start`. */
function timed(text: string, start = 3, step = 3.6): LyricLine[] {
	return text
		.trim()
		.split('\n')
		.map((t, i) => ({ time: +(start + i * step).toFixed(2), text: t.trim() }));
}

// All songs and lyrics below are original placeholder material written for this demo.
const paperSatellites = timed(`
Folded up the night into a paper plane
Threw it past the streetlights, called it by your name
Every little window glowing like a sign
I keep tuning in to find you on the line
Paper satellites, drifting through the blue
Every signal that I send comes back to you
Paper satellites, holding up the sky
Light enough to fall, strong enough to fly
Static on the radio, a whisper in the hum
Counting down the seconds till the morning comes
Ink across my fingers, maps I never read
All the words I wrote you running through my head
Paper satellites, drifting through the blue
Every signal that I send comes back to you
Paper satellites, holding up the sky
Light enough to fall, strong enough to fly
Ooh, carry me home
Ooh, you're not alone
`);

const neonTide = timed(
	`
City's breathing slow tonight
Pulling colors from the light
Every corner, every sign
Spilling over, red and lime
We ride the neon tide
Wave after wave, side by side
Nothing left for us to hide
Out on the neon tide
Taxi lights like falling stars
Sketching rivers on the cars
Hold my hand and count to three
Let the current carry me
We ride the neon tide
Wave after wave, side by side
Oh-oh, let it wash over
Out on the neon tide
`,
	2.5,
	3.4
);

const goldenHour = timed(
	`
Sunlight on the dashboard, crackle in the air
Song we never finished, playing everywhere
Rolling down the window, letting summer in
Humming half a melody I can't begin
Golden hour static
Turning up the sound
Golden hour static
Spinning us around
Every mile marker blinking out of view
Every faded postcard leading back to you
Shadows getting longer, but we don't mind
We've got all the time that we can find
Golden hour static
Turning up the sound
Stay, stay a little while
Stay
`,
	3,
	3.8
);

function durationFor(lines: LyricLine[], tail = 7): number {
	return Math.ceil((lines.at(-1)?.time ?? 0) + tail);
}

export const TRACKS: Track[] = [
	{
		id: 'paper-satellites',
		title: 'Paper Satellites',
		artist: 'Nova Lane',
		album: 'Signals',
		duration: durationFor(paperSatellites),
		accentRgb: '44, 58, 150',
		art: { from: '#3b59ff', to: '#120a3a', glyph: '◐' },
		lines: paperSatellites
	},
	{
		id: 'neon-tide',
		title: 'Neon Tide',
		artist: 'The Quiet Hours',
		album: 'After Dark',
		duration: durationFor(neonTide),
		accentRgb: '18, 100, 104',
		art: { from: '#19d3c5', to: '#0b2a4a', glyph: '≈' },
		lines: neonTide
	},
	{
		id: 'low-orbit',
		title: 'Low Orbit (Instrumental)',
		artist: 'Ferro',
		album: 'Drift',
		duration: 42,
		accentRgb: '120, 74, 26',
		art: { from: '#ffb547', to: '#3a1606', glyph: '○' },
		lines: []
	},
	{
		id: 'golden-hour-static',
		title: 'Golden Hour Static',
		artist: 'Mira & The Echoes',
		album: 'Postcards',
		duration: durationFor(goldenHour),
		accentRgb: '128, 36, 72',
		art: { from: '#ff5c8a', to: '#2b0b2a', glyph: '✦' },
		lines: goldenHour
	}
];

/** Binary search: largest index with line.time <= t, or -1. Same as the extension's lrc-parse. */
export function activeLineIndex(lines: LyricLine[], t: number): number {
	let lo = 0;
	let hi = lines.length - 1;
	let ans = -1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		if (lines[mid].time <= t) {
			ans = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return ans;
}

export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const total = Math.floor(seconds);
	return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}
