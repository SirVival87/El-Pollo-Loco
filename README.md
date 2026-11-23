# El Pollo Loco

Ein 2D-Jump-and-Run als JavaScript-Portfolio-Projekt mit HTML5 Canvas, responsivem Layout, Objektklassen und selbst erzeugten Spielgeräuschen.

## Spielen

Öffne **index.html** im Browser. Das Spiel benötigt keine Installation und keinen Build-Schritt.

| Aktion | Tastatur |
| --- | --- |
| Laufen | A / D oder Pfeiltasten links / rechts |
| Springen | W, Pfeil nach oben oder Leertaste |
| Flasche werfen | E oder F |

Die Bildschirmtasten erscheinen auf Geräten mit Touch-Eingabe. Im mobilen Querformat liegen die Laufpfeile links neben der Leinwand und die Aktionstasten rechts. Ton und Vollbild lassen sich oben rechts umschalten.

Sammle Münzen und Flaschen. Normale Hühner lassen sich mit einer Flasche oder einem Sprung von oben besiegen. Der Endboss ist am Ende des Levels. Triff ihn mit Flaschen, wenn er am Boden ist.

## Projektstruktur

- **script.js** startet und beendet Spielrunden und koordiniert die Pause.
- **classes/** enthält Spielfiguren, Spielwelt, Rendering, Flaschen und Audio.
- **levels/** enthält den Aufbau und die Platzierungsdaten des Levels.
- **js/** enthält die Einstellungen und die Bildschirmsteuerung.
- **styles/** enthält die Stylesheets für Spielfläche, Steuerung und Dialoge.
- **img/** und **fonts/** enthalten die Grafiken und Schriften.

## Musik

Die Hintergrundmusik ist [Mexico Mexican Mariachi Music von ikoliks_aj](https://pixabay.com/music/latin-mexico-mexican-mariachi-music-468180/) und wird unter der [Pixabay Content License](https://pixabay.com/service/license-summary/) im Spiel verwendet.

## Grafiken und Schriften

- Figuren, Spielflächen und Spielgrafiken kommen aus den bereitgestellten Unterrichtsmaterialien.
- Das zusätzlich eingebundene Wüstenmotiv wurde mit ImageGen erstellt.
- Die Schriften Rye und Boogaloo stehen unter der SIL Open Font License. Die Lizenztexte liegen bei den Schriftdateien.
