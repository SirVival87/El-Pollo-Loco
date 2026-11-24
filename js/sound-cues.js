/**
 * Catalog of synthesized effects and their tone and noise layers.
 * @type {Object<string, SoundCue>}
 */
const soundCues = {
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
    bossHurt: {
        tones: [
            { shape: 'triangle', start: 620, end: 350, duration: 0.13, volume: 1.7 },
            { shape: 'sawtooth', start: 420, end: 160, delay: 0.10, duration: 0.22, volume: 1.15 },
        ],
        noise: [{ start: 1550, end: 480, duration: 0.2, volume: 0.65 }],
    },
    sleep: {
        interval: 2.6,
        tones: [
            { shape: 'triangle', start: 128, end: 83, duration: 0.55, volume: 1.4, attack: 0.13 },
            { shape: 'sine', start: 92, end: 74, delay: 0.65, duration: 0.48, volume: 0.9, attack: 0.11 },
        ],
        noise: [
            { start: 660, end: 280, duration: 0.55, volume: 1.8, attack: 0.14 },
            { start: 330, end: 520, delay: 0.65, duration: 0.5, volume: 1.45, attack: 0.11 },
        ],
    },
};
