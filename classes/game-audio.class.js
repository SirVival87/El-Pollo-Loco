class GameAudio {
    enabled = true;
    volume = 100;
    musicVolume = 50;
    roundActive = false;
    storageKey = 'el-pollo-loco-audio';
    paused = false;
    lastPlayed = new Map();

    cues = {
        pickup: {
            tones: [{ start: 550, end: 920, duration: 0.12, volume: 0.5 }],
        },
        coin: {
            tones: [
                { shape: 'sine', start: 1470, end: 1460, duration: 0.21, volume: 0.43 },
                { shape: 'sine', start: 2610, end: 2570, duration: 0.13, volume: 0.28 },
                { shape: 'sine', start: 3970, end: 3850, duration: 0.055, volume: 0.2 },
                { shape: 'sine', start: 2080, end: 2050, delay: 0.045, duration: 0.16, volume: 0.28 },
            ],
        },
        jump: {
            tones: [{ start: 215, end: 630, duration: 0.16, volume: 0.46 }],
            noise: [{ start: 780, end: 2000, duration: 0.08, volume: 0.26 }],
        },
        sandStep: {
            interval: 0.19,
            noise: [
                { start: 720, end: 390, duration: 0.095, volume: 2.2, attack: 0.015 },
                { start: 2350, end: 880, delay: 0.025, duration: 0.08, volume: 1.12 },
            ],
        },
        throw: {
            tones: [{ start: 330, end: 150, duration: 0.1, volume: 0.28 }],
            noise: [{ start: 3100, end: 630, duration: 0.14, volume: 0.48, attack: 0.018 }],
        },
        splash: {
            tones: [
                { start: 245, end: 78, duration: 0.17, volume: 0.43 },
                { shape: 'sine', start: 420, end: 180, delay: 0.032, duration: 0.11, volume: 0.22 },
            ],
            noise: [
                { start: 1800, end: 480, duration: 0.2, volume: 0.6 },
                { start: 2600, end: 1000, delay: 0.042, duration: 0.1, volume: 0.29 },
            ],
        },
        bottleLand: {
            tones: [{ shape: 'sine', start: 132, end: 63, duration: 0.12, volume: 0.42 }],
            noise: [{ start: 1100, end: 330, duration: 0.16, volume: 0.52 }],
        },
        chickenHit: {
            tones: [
                { start: 650, end: 305, duration: 0.085, volume: 0.43 },
                { start: 540, end: 255, delay: 0.073, duration: 0.11, volume: 0.38 },
            ],
            noise: [{ start: 980, end: 330, duration: 0.1, volume: 0.38 }],
        },
        chickenDeath: {
            tones: [
                { shape: 'sine', start: 145, end: 62, duration: 0.13, volume: 0.5 },
                { start: 850, end: 310, delay: 0.028, duration: 0.09, volume: 0.5 },
                { start: 530, end: 205, delay: 0.102, duration: 0.14, volume: 0.26 },
            ],
            noise: [{ start: 1180, end: 460, duration: 0.12, volume: 0.4 }],
        },
        smallChickenHit: {
            tones: [
                { shape: 'sine', start: 1380, end: 770, duration: 0.07, volume: 0.55 },
                { shape: 'sine', start: 1660, end: 820, delay: 0.06, duration: 0.085, volume: 0.46 },
            ],
            noise: [{ start: 1650, end: 700, duration: 0.08, volume: 0.32 }],
        },
        bossHit: {
            tones: [{ start: 113, end: 44, duration: 0.27, volume: 0.72 }],
            noise: [{ start: 460, end: 122, duration: 0.23, volume: 0.83 }],
        },
        bossAttack: {
            tones: [
                { shape: 'sawtooth', start: 82, end: 178, duration: 0.23, volume: 0.35 },
                { start: 235, end: 78, delay: 0.14, duration: 0.2, volume: 0.38 },
            ],
            noise: [{ start: 320, end: 1300, duration: 0.29, volume: 0.52, attack: 0.055 }],
        },
        bossStep: {
            interval: 0.32,
            tones: [{ shape: 'sine', start: 88, end: 50, duration: 0.15, volume: 0.56 }],
            noise: [{ start: 480, end: 170, duration: 0.15, volume: 0.62 }],
        },
    };

    /** Liest Lautstärke und Tonstatus aus dem lokalen Speicher. */
    constructor(music) {
        this.music = music;
        try {
            const preferences = JSON.parse(localStorage.getItem(this.storageKey));
            if (typeof preferences?.enabled === 'boolean') this.enabled = preferences.enabled;
            if (Number.isFinite(preferences?.volume)) this.volume = this.clampVolume(preferences.volume);
            if (Number.isFinite(preferences?.musicVolume)) {
                this.musicVolume = this.clampVolume(preferences.musicVolume);
            }
        } catch {
            // Use defaults when storage is blocked or contains invalid data.
        }
    }

    /** Speichert die aktuelle Lautstärke und den Tonstatus. */
    savePreferences() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                enabled: this.enabled,
                volume: this.volume,
                musicVolume: this.musicVolume,
            }));
        } catch {
            // Volume still works for the current session.
        }
    }

    /** Initialisiert die Audioausgabe nach einer Benutzereingabe. */
    unlock() {
        if (!this.enabled || !globalThis.AudioContext) return;

        if (!this.context) this.createAudioOutput();
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }
    }

    /** Initialisiert die Ausgänge für Effekte und Musik. */
    createAudioOutput() {
        this.context = new AudioContext();
        this.output = this.context.createGain();
        this.output.connect(this.context.destination);
        this.updateVolume();
        this.noiseBuffer = this.createNoiseBuffer();

        // Beim direkten Start aus index.html spielt das Element die lokale Datei selbst ab.
        if (location.protocol !== 'file:') {
            this.musicGain = this.context.createGain();
            this.context.createMediaElementSource(this.music).connect(this.musicGain);
            this.musicGain.connect(this.context.destination);
        }
    }

    /** Schaltet den Spielton dauerhaft ein oder aus. */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
        this.savePreferences();
    }

    /** Setzt und speichert eine Lautstärke zwischen 0 und 100. */
    setVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.volume = this.clampVolume(volume);
        this.updateVolume();
        this.savePreferences();
    }

    /** Setzt und speichert die Lautstärke der Hintergrundmusik. */
    setMusicVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.musicVolume = this.clampVolume(volume);
        this.updateMusicVolume();
        this.savePreferences();
    }

    /** Begrenzt die Lautstärke auf den Wertebereich der Regler. */
    clampVolume(volume) {
        return Math.max(0, Math.min(100, volume));
    }

    /** Bereitet den Ton für eine neue Runde vor und startet die Musik von vorn. */
    startRound() {
        this.roundActive = true;
        this.paused = false;
        this.music.currentTime = 0;
        this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
    }

    /** Stoppt die Hintergrundmusik am Ende der Runde. */
    endRound() {
        this.roundActive = false;
        this.setPaused(false);
        this.music.currentTime = 0;
    }

    /** Stellt die Audioausgabe während einer Spielpause stumm. */
    setPaused(paused) {
        this.paused = paused;
        if (!paused && this.roundActive) this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
    }

    /** Startet oder pausiert die Musik entsprechend dem Spiel- und Tonstatus. */
    syncMusicPlayback() {
        this.updateMusicVolume();
        if (!this.enabled || !this.roundActive || this.paused) {
            this.music.pause();
            return;
        }
        if (this.music.paused) this.music.play().catch(() => {});
    }

    /** Überträgt die gewünschte Musiklautstärke auf den aktiven Audioausgang. */
    updateMusicVolume() {
        const volume = this.musicVolume / 100;
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        } else {
            this.music.volume = volume;
            this.music.muted = volume === 0;
        }
    }

    /** Überträgt Lautstärke, Tonstatus und Pause auf die Audioausgabe. */
    updateVolume() {
        if (this.output) this.output.gain.value = this.enabled && !this.paused ? 0.2 * this.volume / 100 : 0;
    }

    /** Erzeugt eine Sekunde weißes Rauschen für die Soundeffekte. */
    createNoiseBuffer() {
        const { sampleRate } = this.context;
        const buffer = this.context.createBuffer(1, sampleRate, sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
            samples[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /** Spielt einen bekannten Soundeffekt unter Berücksichtigung seiner Wiederholrate. */
    play(name) {
        const cue = this.cues[name];
        if (!cue || !this.enabled || this.paused || this.context?.state !== 'running') return;

        const now = this.context.currentTime;
        if (cue.interval) {
            const previous = this.lastPlayed.get(name) ?? -Infinity;
            if (now - previous < cue.interval) return;
            this.lastPlayed.set(name, now);
        }

        for (const tone of cue.tones ?? []) this.playTone(tone, now);
        for (const noise of cue.noise ?? []) this.playNoise(noise, now);
    }

    /** Spielt eine Tonspur mit gleitender Frequenz. */
    playTone(layer, now) {
        const { start, end, duration, delay = 0, shape = 'triangle' } = layer;
        const startTime = now + delay;
        const oscillator = this.context.createOscillator();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(start, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(end, startTime + duration);
        this.playLayer(oscillator, oscillator, layer, startTime);
    }

    /** Spielt eine gefilterte Rauschspur. */
    playNoise(layer, now) {
        const { start, end, duration, delay = 0 } = layer;
        const startTime = now + delay;
        const source = this.context.createBufferSource();
        const filter = this.context.createBiquadFilter();
        source.buffer = this.noiseBuffer;
        filter.type = 'bandpass';
        filter.Q.value = 0.7;
        filter.frequency.setValueAtTime(start, startTime);
        filter.frequency.exponentialRampToValueAtTime(end, startTime + duration);
        source.connect(filter);
        const offset = Math.random() * (this.noiseBuffer.duration - duration);
        this.playLayer(source, filter, layer, startTime, offset);
    }

    /** Startet die Audiospur und trennt ihre Knoten nach dem Abspielen. */
    playLayer(source, tail, layer, startTime, offset) {
        const endTime = startTime + layer.duration;
        const envelope = this.createEnvelope(layer, startTime, endTime);
        tail.connect(envelope);
        envelope.connect(this.output);
        source.onended = () => {
            source.disconnect();
            if (tail !== source) tail.disconnect();
            envelope.disconnect();
        };
        if (offset === undefined) source.start(startTime);
        else source.start(startTime, offset);
        source.stop(endTime);
    }

    /** Erzeugt den Lautstärkeverlauf einer Audiospur. */
    createEnvelope(layer, startTime, endTime) {
        const { volume, attack = 0.004 } = layer;
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.001, startTime);
        envelope.gain.exponentialRampToValueAtTime(volume, startTime + attack);
        envelope.gain.exponentialRampToValueAtTime(0.001, endTime);
        return envelope;
    }
}
