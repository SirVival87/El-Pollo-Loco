/** Mischt Soundeffekte und Hintergrundmusik und speichert beide Lautstärken. */
class GameAudio {
    static volumeScaleVersion = 2;
    enabled = true;
    volume = 50;
    musicVolume = 50;
    orientationBlocked = false;
    resultMusicTimer = null;
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
        victory: {
            tones: [
                { shape: 'triangle', start: 523.25, end: 523.25, duration: 0.13, volume: 2.04 },
                { shape: 'triangle', start: 659.25, end: 659.25, delay: 0.11, duration: 0.13, volume: 2.19 },
                { shape: 'triangle', start: 783.99, end: 783.99, delay: 0.22, duration: 0.14, volume: 2.34 },
                { shape: 'triangle', start: 1046.5, end: 1046.5, delay: 0.34, duration: 0.39, volume: 2.46 },
                { shape: 'sine', start: 523.25, end: 523.25, delay: 0.34, duration: 0.34, volume: 1.26 },
            ],
        },
        gameOver: {
            tones: [
                { shape: 'triangle', start: 392, end: 392, duration: 0.16, volume: 2.16 },
                { shape: 'triangle', start: 293.66, end: 293.66, delay: 0.14, duration: 0.17, volume: 2.25 },
                { shape: 'triangle', start: 233.08, end: 233.08, delay: 0.29, duration: 0.17, volume: 2.16 },
                { shape: 'triangle', start: 196, end: 164, delay: 0.44, duration: 0.31, volume: 2.34 },
                { shape: 'sine', start: 98, end: 82, delay: 0.44, duration: 0.31, volume: 1.38 },
            ],
        },
        bossStep: {
            interval: 0.32,
            tones: [{ shape: 'sine', start: 88, end: 50, duration: 0.15, volume: 0.56 }],
            noise: [{ start: 480, end: 170, duration: 0.15, volume: 0.62 }],
        },
    };

    /** Liest Lautstärke und Tonstatus aus dem lokalen Speicher.
     * @param {HTMLAudioElement} music - Medienelement für die Hintergrundmusik. */
    constructor(music) {
        this.music = music;
        try {
            this.restorePreferences(JSON.parse(localStorage.getItem(this.storageKey)));
        } catch {
            // Use defaults when storage is blocked or contains invalid data.
        }
    }

    /** Übernimmt gespeicherte Werte und rechnet ältere Reglerpositionen um.
     * @param {(AudioPreferences|null)} preferences - Gelesene Einstellungen oder null, wenn keine vorliegen. */
    restorePreferences(preferences) {
        if (!preferences) return;
        const { enabled, volume, musicVolume, volumeScale } = preferences;
        const useCurrentScale = volumeScale === GameAudio.volumeScaleVersion;
        if (typeof enabled === 'boolean') this.enabled = enabled;
        if (Number.isFinite(volume)) this.volume = this.restoreVolume(volume, useCurrentScale);
        if (Number.isFinite(musicVolume)) this.musicVolume = this.restoreVolume(musicVolume, useCurrentScale);
    }

    /** Ordnet einer älteren Lautstärke die passende Position auf der neuen Skala zu.
     * @param {number} volume - Reglerposition zwischen 0 und 100.
     * @param {boolean} useCurrentScale - Ob der gespeicherte Wert bereits die neue Skala verwendet.
     * @returns {number} Position auf der aktuellen Lautstärkeskala. */
    restoreVolume(volume, useCurrentScale) {
        const percentage = this.clampVolume(volume);
        if (useCurrentScale) return percentage;
        const position = percentage <= 10 ? percentage * 5 : 50 + (percentage - 10) / 90 * 50;
        return Math.round(position);
    }

    /** Speichert die aktuelle Lautstärke und den Tonstatus. */
    savePreferences() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                volumeScale: GameAudio.volumeScaleVersion,
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
        if (location.protocol !== 'file:') this.connectMusicOutput();
    }

    /** Bindet die Musik an einen eigenen Audioausgang mit regelbarer Lautstärke. */
    connectMusicOutput() {
        this.musicGain = this.context.createGain();
        this.context.createMediaElementSource(this.music).connect(this.musicGain);
        this.musicGain.connect(this.context.destination);
        this.music.volume = 1;
        this.music.muted = false;
        this.updateMusicVolume();
    }

    /** Schaltet den Spielton dauerhaft ein oder aus.
     * @param {boolean} enabled - Ob Musik und Soundeffekte aktiviert sein sollen. */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
        this.savePreferences();
    }

    /** Setzt und speichert eine Lautstärke zwischen 0 und 100.
     * @param {number} volume - Reglerposition zwischen 0 und 100. */
    setVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.volume = this.clampVolume(volume);
        this.updateVolume();
        this.savePreferences();
    }

    /** Setzt und speichert die Lautstärke der Hintergrundmusik.
     * @param {number} volume - Reglerposition zwischen 0 und 100. */
    setMusicVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.musicVolume = this.clampVolume(volume);
        this.updateMusicVolume();
        this.savePreferences();
    }

    /** Begrenzt die Lautstärke auf den Wertebereich der Regler.
     * @param {number} volume - Zu begrenzender Reglerwert.
     * @returns {number} Auf den Bereich von 0 bis 100 begrenzter Wert. */
    clampVolume(volume) {
        return Math.max(0, Math.min(100, volume));
    }

    /** Nutzt eine Benutzereingabe, um die Audioausgabe freizuschalten. */
    startPlayback() {
        this.unlock();
        this.syncMusicPlayback();
    }

    /** Spielt den passenden Endsound und gibt ihm Vorrang vor der Musik.
     * @param {boolean} won - Ob die Runde gewonnen wurde. */
    playResult(won) {
        this.setPaused(false);
        const name = won ? 'victory' : 'gameOver';
        if (this.canPlayEffects() && this.volume > 0 && this.context?.state === 'running') {
            this.muteMusicDuringCue(name);
        }
        this.play(name);
    }

    /** Schaltet die Musik für die Laufzeit des Endsignals stumm.
     * @param {string} name - Name des Endsignals mit Tonspuren. Zulässig sind victory und gameOver. */
    muteMusicDuringCue(name) {
        const duration = Math.max(...this.cues[name].tones.map(tone => (tone.delay ?? 0) + tone.duration));
        clearTimeout(this.resultMusicTimer);
        this.resultMusicTimer = setTimeout(() => {
            this.resultMusicTimer = null;
            this.updateMusicVolume();
        }, duration * 1000);
        this.updateMusicVolume();
    }

    /** @param {boolean} blocked - Ob die Drehaufforderung die Audioausgabe sperrt. */
    setOrientationBlocked(blocked) {
        this.orientationBlocked = blocked;
        this.updateVolume();
        this.syncMusicPlayback();
    }

    /** Stellt die Audioausgabe während einer Spielpause stumm.
     * @param {boolean} paused - Ob das Spiel pausiert. */
    setPaused(paused) {
        this.paused = paused;
        if (!paused && this.context?.state === 'suspended') this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
    }

    /** Startet oder pausiert die Musik entsprechend dem Spiel- und Tonstatus. */
    syncMusicPlayback() {
        this.updateMusicVolume();
        if (!this.enabled || this.paused || this.orientationBlocked || document.hidden) {
            this.music.pause();
            return;
        }
        if (this.music.paused) this.music.play().catch(() => {});
    }

    /** Überträgt die gewünschte Musiklautstärke auf den aktiven Audioausgang. */
    updateMusicVolume() {
        const volume = this.resultMusicTimer === null ? this.getVolumeGain(this.musicVolume) : 0;
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        } else {
            this.music.volume = volume;
            this.music.muted = volume === 0;
        }
    }

    /** @returns {boolean} Ob Tonstatus, Sichtbarkeit, Ausrichtung und Pause Soundeffekte erlauben. */
    canPlayEffects() {
        return this.enabled && !this.paused && !this.orientationBlocked && !document.hidden;
    }

    /** Überträgt Lautstärke, Tonstatus und Pause auf die Audioausgabe. */
    updateVolume() {
        if (!this.output) return;
        const gain = 0.2 * this.getVolumeGain(this.volume);
        this.output.gain.value = this.canPlayEffects() ? gain : 0;
    }

    /** Bildet die Reglerposition ab, sodass die Mitte der früheren Lautstärke bei 10 % entspricht.
     * @param {number} percentage - Reglerposition zwischen 0 und 100.
     * @returns {number} Verstärkungsfaktor zwischen 0 und 1. */
    getVolumeGain(percentage) {
        if (percentage <= 50) return percentage / 50 * 0.1;
        return 0.1 + (percentage - 50) / 50 * 0.9;
    }

    /** @returns {AudioBuffer} Monopuffer mit einer Sekunde weißem Rauschen für die Soundeffekte. */
    createNoiseBuffer() {
        const { sampleRate } = this.context;
        const buffer = this.context.createBuffer(1, sampleRate, sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
            samples[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /** Spielt einen bekannten Soundeffekt unter Berücksichtigung seiner Wiederholrate.
     * @param {string} name - Schlüssel eines Soundeffekts im Katalog. */
    play(name) {
        const cue = this.cues[name];
        if (!cue || !this.canPlayEffects() || this.context?.state !== 'running') return;
        const now = this.context.currentTime;
        if (cue.interval) {
            const previous = this.lastPlayed.get(name) ?? -Infinity;
            if (now - previous < cue.interval) return;
            this.lastPlayed.set(name, now);
        }

        for (const tone of cue.tones ?? []) this.playTone(tone, now);
        for (const noise of cue.noise ?? []) this.playNoise(noise, now);
    }

    /** Spielt eine Tonspur mit gleitender Frequenz.
     * @param {SoundLayer} layer - Parameter der Tonspur.
     * @param {number} now - Bezugszeit des AudioContext in Sekunden. */
    playTone(layer, now) {
        const { start, end, duration, delay = 0, shape = 'triangle' } = layer;
        const startTime = now + delay;
        const oscillator = this.context.createOscillator();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(start, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(end, startTime + duration);
        this.playLayer(oscillator, oscillator, layer, startTime);
    }

    /** Spielt eine gefilterte Rauschspur.
     * @param {SoundLayer} layer - Parameter der gefilterten Rauschspur.
     * @param {number} now - Bezugszeit des AudioContext in Sekunden. */
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

    /** Startet die Audiospur und trennt ihre Knoten nach dem Abspielen.
     * @param {AudioScheduledSourceNode} source - Abspielbarer Audioquellknoten.
     * @param {AudioNode} tail - Ausgangsknoten der Spur vor der Lautstärkehüllkurve.
     * @param {SoundLayer} layer - Zeit- und Lautstärkeparameter der Spur.
     * @param {number} startTime - Startzeit auf der Zeitleiste des AudioContext in Sekunden.
     * @param {number} [offset] - Abspielposition im Rauschpuffer in Sekunden. */
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

    /** Erzeugt den Lautstärkeverlauf einer Audiospur.
     * @param {SoundLayer} layer - Lautstärke und Einschwingzeit der Spur.
     * @param {number} startTime - Beginn der Spur auf der Zeitleiste des AudioContext in Sekunden.
     * @param {number} endTime - Ende der Spur auf der Zeitleiste des AudioContext in Sekunden.
     * @returns {GainNode} Knoten mit der geplanten Lautstärkehüllkurve. */
    createEnvelope(layer, startTime, endTime) {
        const { volume, attack = 0.004 } = layer;
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.001, startTime);
        envelope.gain.exponentialRampToValueAtTime(volume, startTime + attack);
        envelope.gain.exponentialRampToValueAtTime(0.001, endTime);
        return envelope;
    }
}
