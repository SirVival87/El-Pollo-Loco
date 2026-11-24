/** Starts and tracks the timed boss fight. */
class BossEncounter {
    static activationDistance = 400;
    static duration = 60;

    started = false;
    remaining = BossEncounter.duration;

    /**
     * Connects the encounter to the world and its HUD.
     * @param {World} world - Round containing the player and boss.
     */
    constructor(world) {
        this.world = world;
        this.hud = document.getElementById('boss-hud');
        this.health = document.getElementById('boss-health');
        this.timer = document.getElementById('boss-time');
    }

    /** Hides the encounter HUD when the current round ends. */
    hide() {
        this.hud.hidden = true;
    }

    /**
     * Starts the encounter on approach and advances it in active game time.
     * @param {number} deltaTime - Time elapsed during the current simulation step, in seconds.
     */
    update(deltaTime) {
        const { boss, character, win } = this.world;
        if (!boss) return;

        if (win === null) {
            if (this.started) this.advanceCountdown(deltaTime);
            else if (Math.abs(character.x - boss.x) <= BossEncounter.activationDistance) this.start();
        }

        if (this.started) this.updateHud(boss);
    }

    /** Reveals the fight HUD and switches the active music track. */
    start() {
        this.started = true;
        this.hud.hidden = false;
        this.world.audio?.setBossMusic?.(true);
    }

    /**
     * Counts down to a loss if the boss is still alive.
     * @param {number} deltaTime - Time elapsed in seconds of active play.
     */
    advanceCountdown(deltaTime) {
        this.remaining = Math.max(0, this.remaining - deltaTime);
        if (this.remaining > 1e-9) return;

        this.remaining = 0;
        this.world.character.energy = 0;
        this.world.updateGameResult();
    }

    /**
     * Updates the boss health meter and remaining seconds.
     * @param {Endboss} boss - Boss whose current energy is displayed.
     */
    updateHud(boss) {
        const value = Math.max(0, boss.energy);
        const time = Math.ceil(this.remaining - 1e-9) + ' s';
        if (this.health.value !== value) this.health.value = value;
        if (this.timer.textContent !== time) this.timer.textContent = time;
    }
}
