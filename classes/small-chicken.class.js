/** Schnelle, unverwundbare Huhnvariante mit eigenem Sprite-Ordner. */
class SmallChicken extends Chicken {
    static size = 36;
    static spriteFolder = 'chicken_small';
    static speedMultiplier = 2;
    static deadImage = null;
    static hitboxOffset = { left: 4, top: 3, right: 4, bottom: 3 };
}
