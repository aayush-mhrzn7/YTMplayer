import { TRACKS, activeLineIndex, type Track } from './tracks';

export type RepeatMode = 'NONE' | 'ALL' | 'ONE';
export type LyricsStatus = 'loading' | 'ready' | 'instrumental';
export type DemoTab = 'ytm' | 'site' | 'docs' | 'mail';

/**
 * A simulated YouTube Music session plus the extension's prefs.
 * Mirrors the state the real extension keeps in chrome.storage, so the
 * widget and popup components behave like the real ones.
 */
export class DemoPlayer {
	readonly tracks: Track[] = TRACKS;

	index = $state(0);
	playing = $state(false);
	time = $state(0);
	shuffle = $state(false);
	repeat = $state<RepeatMode>('NONE');
	lyricsStatus = $state<LyricsStatus>('ready');

	// Extension prefs (same names/semantics as the extension's Prefs)
	enabled = $state(true);
	minimized = $state(false);
	minimizePinned = $state(false);
	transportEnabled = $state(true);
	/** Widget position inside the demo viewport; null = default corner */
	pos = $state<{ left: number; bottom: number } | null>(null);

	// Demo browser chrome
	tab = $state<DemoTab>('site');
	popupOpen = $state(false);

	track = $derived(this.tracks[this.index]);
	activeIndex = $derived(
		this.lyricsStatus === 'ready' ? activeLineIndex(this.track.lines, this.time) : -1
	);

	#raf = 0;
	#last = 0;
	#loadTimer: ReturnType<typeof setTimeout> | undefined;

	start(): () => void {
		const loop = (now: number) => {
			this.#raf = requestAnimationFrame(loop);
			const dt = this.#last ? Math.min(0.25, (now - this.#last) / 1000) : 0;
			this.#last = now;
			if (!this.playing) return;
			const t = this.time + dt;
			if (t >= this.track.duration) this.#onEnded();
			else this.time = t;
		};
		this.#raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(this.#raf);
			clearTimeout(this.#loadTimer);
		};
	}

	#onEnded(): void {
		if (this.repeat === 'ONE') {
			this.time = 0;
			return;
		}
		const last = this.index === this.tracks.length - 1;
		if (last && this.repeat === 'NONE' && !this.shuffle) {
			// End of queue: stop like YouTube Music does
			this.select(0, false);
			return;
		}
		this.next();
	}

	/** Load a track and simulate the lrclib fetch. */
	select(i: number, autoplay = true): void {
		this.index = (i + this.tracks.length) % this.tracks.length;
		this.time = 0;
		this.playing = autoplay;
		this.lyricsStatus = 'loading';
		clearTimeout(this.#loadTimer);
		this.#loadTimer = setTimeout(() => {
			this.lyricsStatus = this.track.lines.length ? 'ready' : 'instrumental';
			this.#syncMinimizeToLyrics();
		}, 650);
	}

	/** Collapse when there are no lyrics; re-expand when they return unless the user pinned it. */
	#syncMinimizeToLyrics(): void {
		if (this.lyricsStatus === 'instrumental') {
			this.minimized = true;
		} else if (this.lyricsStatus === 'ready' && !this.minimizePinned) {
			this.minimized = false;
		}
	}

	toggle(): void {
		this.playing = !this.playing;
	}

	next(): void {
		if (this.shuffle && this.tracks.length > 1) {
			let n = this.index;
			while (n === this.index) n = Math.floor(Math.random() * this.tracks.length);
			this.select(n);
		} else {
			this.select(this.index + 1);
		}
	}

	previous(): void {
		if (this.time > 3) this.time = 0;
		else this.select(this.index - 1);
	}

	seek(t: number): void {
		this.time = Math.max(0, Math.min(t, this.track.duration - 0.05));
	}

	seekBy(delta: number): void {
		this.seek(this.time + delta);
	}

	toggleShuffle(): void {
		this.shuffle = !this.shuffle;
	}

	cycleRepeat(): void {
		this.repeat = this.repeat === 'NONE' ? 'ALL' : this.repeat === 'ALL' ? 'ONE' : 'NONE';
	}

	// Widget header actions
	toggleMinimize(): void {
		const next = !this.minimized;
		// Manual minimize pins; maximize clears the pin so auto can work again
		this.minimized = next;
		this.minimizePinned = next;
	}

	close(): void {
		// Close = turn overlay off (popup checkbox unchecks)
		this.enabled = false;
		this.minimized = false;
		this.minimizePinned = false;
	}

	setEnabled(on: boolean): void {
		this.enabled = on;
		if (on) {
			this.minimized = this.lyricsStatus === 'instrumental';
			this.minimizePinned = false;
		}
	}

	/** Seconds of the first chorus line, used by the feature tour. */
	chorusTime(): number {
		const lines = this.track.lines;
		const counts = new Map<string, number>();
		for (const l of lines) counts.set(l.text, (counts.get(l.text) ?? 0) + 1);
		const repeated = lines.find((l) => (counts.get(l.text) ?? 0) > 1);
		return repeated?.time ?? 0;
	}
}
