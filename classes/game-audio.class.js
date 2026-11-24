/** Mixes sound effects and background music and saves their volume settings. */
class GameAudio {
    static volumeScaleVersion = 2;
    enabled = true;
    volume = 50;
    musicVolume = 50;
    orientationBlocked = false;
    resultMusicTimer = null;
    storageKey = 'el-pollo-loco-audio';
    paused = false;
    sleeping = false;
    lastPlayed = new Map();
    cues = soundCues;

    /** Loads volume and mute settings from local storage.
     * @param {HTMLAudioElement} music - Media element for background music. */
    constructor(music) {
        this.music = music;
        this.normalMusic = music.getAttribute('src');
        try {
            this.restorePreferences(JSON.parse(localStorage.getItem(this.storageKey)));
        } catch {
            // Use defaults when storage is blocked or contains invalid data.
        }
    }

    /** Restores saved preferences and converts older slider values.
     * @param {(AudioPreferences|null)} preferences - Saved preferences or null when none are available. */
    restorePreferences(preferences) {
        if (!preferences) return;
        const { enabled, volume, musicVolume, volumeScale } = preferences;
        const useCurrentScale = volumeScale === GameAudio.volumeScaleVersion;
        if (typeof enabled === 'boolean') this.enabled = enabled;
        if (Number.isFinite(volume)) this.volume = this.restoreVolume(volume, useCurrentScale);
        if (Number.isFinite(musicVolume)) this.musicVolume = this.restoreVolume(musicVolume, useCurrentScale);
    }

    /** Converts an old volume value to the corresponding position on the new scale.
     * @param {number} volume - Slider position from 0 to 100.
     * @param {boolean} useCurrentScale - Whether the stored value already uses the current scale.
     * @returns {number} Position on the current volume scale. */
    restoreVolume(volume, useCurrentScale) {
        const percentage = this.clampVolume(volume);
        if (useCurrentScale) return percentage;
        const position = percentage <= 10 ? percentage * 5 : 50 + (percentage - 10) / 90 * 50;
        return Math.round(position);
    }

    /** Saves the current volume and mute settings. */
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

    /** Initializes audio output after a user interaction. */
    unlock() {
        if (!this.enabled || !globalThis.AudioContext) return;
        if (!this.context) this.createAudioOutput();
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }
    }

    /** Initializes the outputs for sound effects and music. */
    createAudioOutput() {
        this.context = new AudioContext();
        this.output = this.context.createGain();
        this.output.connect(this.context.destination);
        this.sleepOutput = this.context.createGain();
        this.sleepOutput.connect(this.context.destination);
        this.updateVolume();
        this.noiseBuffer = this.createNoiseBuffer();
        if (location.protocol !== 'file:') this.connectMusicOutput();
    }

    /** Routes music to a separate output with independent volume control. */
    connectMusicOutput() {
        this.musicGain = this.context.createGain();
        this.context.createMediaElementSource(this.music).connect(this.musicGain);
        this.musicGain.connect(this.context.destination);
        this.music.volume = 1;
        this.music.muted = false;
        this.updateMusicVolume();
    }

    /** Enables or disables game audio and saves the preference.
     * @param {boolean} enabled - Whether music and sound effects should be enabled. */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) this.unlock();
        this.updateVolume();
        this.syncMusicPlayback();
        this.savePreferences();
    }

    /** Sets and saves the sound-effect volume on a scale from 0 to 100.
     * @param {number} volume - Slider position from 0 to 100. */
    setVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.volume = this.clampVolume(volume);
        this.updateVolume();
        this.savePreferences();
    }

    /** Sets and saves the background music volume.
     * @param {number} volume - Slider position from 0 to 100. */
    setMusicVolume(volume) {
        if (!Number.isFinite(volume)) return;
        this.musicVolume = this.clampVolume(volume);
        this.updateMusicVolume();
        this.savePreferences();
    }

    /** Clamps a volume value to the slider range.
     * @param {number} volume - Slider value to clamp.
     * @returns {number} Value clamped to the range from 0 to 100. */
    clampVolume(volume) {
        return Math.max(0, Math.min(100, volume));
    }

    /** Unlocks audio playback using a user interaction. */
    startPlayback() {
        this.unlock();
        this.syncMusicPlayback();
    }

    /**
     * Switches between the regular music and the boss track.
     * @param {boolean} active - Whether the boss fight is underway.
     */
    setBossMusic(active) {
        const track = active ? this.music.dataset.bossTrack : this.normalMusic;
        if (!track || track === this.music.getAttribute('src')) return;

        this.music.pause();
        this.music.src = track;
        this.syncMusicPlayback();
    }

    /** Plays the result sound and gives it priority over the music.
     * @param {boolean} won - Whether the round was won. */
    playResult(won) {
        this.setBossMusic(false);
        this.setPaused(false);
        const name = won ? 'victory' : 'gameOver';
        if (this.canPlayEffects() && this.volume > 0 && this.context?.state === 'running') {
            this.muteMusicDuringCue(name);
        }
        this.play(name);
    }

    /** Mutes the music for the duration of the result sound.
     * @param {string} name - Result sound with tone layers. Accepted values are victory and gameOver. */
    muteMusicDuringCue(name) {
        const duration = Math.max(...this.cues[name].tones.map(tone => (tone.delay ?? 0) + tone.duration));
        clearTimeout(this.resultMusicTimer);
        this.resultMusicTimer = setTimeout(() => {
            this.resultMusicTimer = null;
            this.updateMusicVolume();
        }, duration * 1000);
        this.updateMusicVolume();
    }

    /** @param {boolean} blocked - Whether the rotate-device prompt blocks audio playback. */
    setOrientationBlocked(blocked) {
        this.orientationBlocked = blocked;
        this.updateVolume();
        this.syncMusicPlayback();
    }

    /** Updates audio playback when the game is paused or resumed.
     * @param {boolean} paused - Whether the game is paused. */
    setPaused(paused) {
        this.paused = paused;
        if (!paused && this.context?.state === 'suspended') this.unlock();
        if (paused) this.updateVolume();
        else this.setSleeping(false);
        this.syncMusicPlayback();
    }

    /**
     * Enables or mutes the separate output for sleeping sounds.
     * @param {boolean} sleeping - Whether Pepe has fallen asleep from inactivity.
     */
    setSleeping(sleeping) {
        this.sleeping = sleeping;
        if (!sleeping) this.lastPlayed.delete('sleep');
        this.updateVolume();
    }

    /** Starts or pauses music according to the game state and audio settings. */
    syncMusicPlayback() {
        this.updateMusicVolume();
        if (!this.enabled || this.paused || this.orientationBlocked || document.hidden) {
            this.music.pause();
            return;
        }
        if (this.music.paused) this.music.play().catch(() => {});
    }

    /** Applies the configured music volume to the active audio output. */
    updateMusicVolume() {
        const volume = this.resultMusicTimer === null ? this.getVolumeGain(this.musicVolume) : 0;
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        } else {
            this.music.volume = volume;
            this.music.muted = volume === 0;
        }
    }

    /** @returns {boolean} Whether audio settings, page visibility, orientation, and pause state allow sound effects. */
    canPlayEffects() {
        return this.canPlayAudio() && !this.paused;
    }

    /** @returns {boolean} Whether the current page state and audio settings allow playback. */
    canPlayAudio() {
        return this.enabled && !this.orientationBlocked && !document.hidden;
    }

    /** Applies effect volume, mute, and pause state to the audio outputs. */
    updateVolume() {
        if (!this.output) return;
        const gain = 0.2 * this.getVolumeGain(this.volume);
        this.output.gain.value = this.canPlayEffects() ? gain : 0;
        if (this.sleepOutput) {
            this.sleepOutput.gain.value = this.canPlayAudio() && this.paused && this.sleeping ? gain : 0;
        }
    }

    /** Maps the slider midpoint to the former volume of 10%.
     * @param {number} percentage - Slider position from 0 to 100.
     * @returns {number} Gain factor between 0 and 1. */
    getVolumeGain(percentage) {
        if (percentage <= 50) return percentage / 50 * 0.1;
        return 0.1 + (percentage - 50) / 50 * 0.9;
    }

    /** @returns {AudioBuffer} Mono buffer containing one second of white noise for sound effects. */
    createNoiseBuffer() {
        const { sampleRate } = this.context;
        const buffer = this.context.createBuffer(1, sampleRate, sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
            samples[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /** Plays a registered effect and enforces its minimum playback interval.
     * @param {string} name - Sound effect key in the catalog. */
    play(name) {
        const cue = this.cues[name];
        const output = name === 'sleep' ? this.sleepOutput : this.output;
        if (!cue || !(output?.gain.value > 0) || this.context?.state !== 'running') return;
        const now = this.context.currentTime;
        if (cue.interval) {
            const previous = this.lastPlayed.get(name) ?? -Infinity;
            if (now - previous < cue.interval) return;
            this.lastPlayed.set(name, now);
        }

        for (const tone of cue.tones ?? []) this.playTone(tone, now, output);
        for (const noise of cue.noise ?? []) this.playNoise(noise, now, output);
    }

    /** Plays a tone layer with a frequency sweep.
     * @param {SoundLayer} layer - Settings for the tone layer.
     * @param {number} now - Reference time on the audio context timeline, in seconds.
     * @param {AudioNode} [output] - Output for the tone layer. Defaults to the effects output. */
    playTone(layer, now, output = this.output) {
        const { start, end, duration, delay = 0, shape = 'triangle' } = layer;
        const startTime = now + delay;
        const oscillator = this.context.createOscillator();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(start, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(end, startTime + duration);
        this.playLayer(oscillator, oscillator, layer, startTime, undefined, output);
    }

    /** Plays a filtered noise layer.
     * @param {SoundLayer} layer - Settings for the filtered noise layer.
     * @param {number} now - Reference time on the audio context timeline, in seconds.
     * @param {AudioNode} [output] - Output for the noise layer. Defaults to the effects output. */
    playNoise(layer, now, output = this.output) {
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
        this.playLayer(source, filter, layer, startTime, offset, output);
    }

    /** Starts an audio layer and disconnects its nodes after playback.
     * @param {AudioScheduledSourceNode} source - Audio source node that can be scheduled for playback.
     * @param {AudioNode} tail - Last node in the layer before its gain envelope.
     * @param {SoundLayer} layer - Timing and gain settings for the layer.
     * @param {number} startTime - Start time on the audio context timeline, in seconds.
     * @param {number} [offset] - Playback offset in the noise buffer, in seconds.
     * @param {AudioNode} [output] - Output for the audio layer. Defaults to the effects output. */
    playLayer(source, tail, layer, startTime, offset, output = this.output) {
        const endTime = startTime + layer.duration;
        const envelope = this.createEnvelope(layer, startTime, endTime);
        tail.connect(envelope);
        envelope.connect(output);
        source.onended = () => {
            source.disconnect();
            if (tail !== source) tail.disconnect();
            envelope.disconnect();
        };
        if (offset === undefined) source.start(startTime);
        else source.start(startTime, offset);
        source.stop(endTime);
    }

    /** Creates the gain envelope for an audio layer.
     * @param {SoundLayer} layer - Peak gain and attack time for the layer.
     * @param {number} startTime - Start of the layer on the audio context timeline, in seconds.
     * @param {number} endTime - End of the layer on the audio context timeline, in seconds.
     * @returns {GainNode} Gain node with the scheduled envelope. */
    createEnvelope(layer, startTime, endTime) {
        const { volume, attack = 0.004 } = layer;
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.001, startTime);
        envelope.gain.exponentialRampToValueAtTime(volume, startTime + attack);
        envelope.gain.exponentialRampToValueAtTime(0.001, endTime);
        return envelope;
    }
}
