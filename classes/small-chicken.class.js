/** Fast chicken variant that can be defeated by a bottle. */
class SmallChicken extends Chicken {
    static size = 36;
    static spriteFolder = 'chicken_small';
    static speedMultiplier = 2;
    static deadImage = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';
    static deadTopOffset = 23;
    static hitboxOffset = { left: 4, top: 3, right: 4, bottom: 3 };
}
