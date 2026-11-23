class GameAudio {
    enabled = true;
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
                { start: 720, end: 390, duration: 0.095, volume: 0.55, attack: 0.015 },
                { start: 2350, end: 880, delay: 0.025, duration: 0.08, volume: 0.28 },
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

    unlock() {
        if (!this.enabled || !globalThis.AudioContext) return;

        if (!this.context) {
            this.context = new AudioContext();
            this.output = this.context.createGain();
            this.output.gain.value = 0.2;
            this.output.connect(this.context.destination);
            this.noiseBuffer = this.createNoiseBuffer();
        }
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) this.unlock();
        if (this.output) this.output.gain.value = enabled ? 0.2 : 0;
    }

    createNoiseBuffer() {
        const { sampleRate } = this.context;
        const buffer = this.context.createBuffer(1, sampleRate, sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
            samples[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    play(name) {
        const cue = this.cues[name];
        if (!cue || !this.enabled || this.context?.state !== 'running') return;

        const now = this.context.currentTime;
        if (cue.interval) {
            const previous = this.lastPlayed.get(name) ?? -Infinity;
            if (now - previous < cue.interval) return;
            this.lastPlayed.set(name, now);
        }

        for (const tone of cue.tones ?? []) this.playTone(tone, now);
        for (const noise of cue.noise ?? []) this.playNoise(noise, now);
    }

    playTone(layer, now) {
        const { start, end, duration, delay = 0, shape = 'triangle' } = layer;
        const startTime = now + delay;
        const oscillator = this.context.createOscillator();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(start, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(end, startTime + duration);
        this.playLayer(oscillator, oscillator, layer, startTime);
    }

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

    playLayer(source, tail, layer, startTime, offset) {
        const { duration, volume, attack = 0.004 } = layer;
        const endTime = startTime + duration;
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.001, startTime);
        envelope.gain.exponentialRampToValueAtTime(volume, startTime + attack);
        envelope.gain.exponentialRampToValueAtTime(0.001, endTime);
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
}
