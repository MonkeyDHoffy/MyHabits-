# Game Rules v1
Version: 1.0
Status: Draft

## Zweck
Beschreibt die Spielregeln (v1) und dient als Referenz fuer Balance-Aenderungen.
Perfekt. Hier ist die klare, komprimierte Gesamtzusammenfassung von:

🐗 Spielregeln (Mechanik)

⚖️ Balancing-Logik

🎯 Ziel-Run-Dauer (~30 Tage)

🧠 Design-Philosophie

Ohne Code. Nur System.

🐗 ROUTINENRPG – SPIELREGELN (v1.0)
🎯 Ziel des Spiels

Ein Run dauert typischerweise ca. 30 Tage.

Der Kampf endet sofort, wenn:

❤️ Spieler LP = 0 → Niederlage

🐗 Schweinehund LP = 0 → Sieg

❤️ Grundwerte

Spieler Max LP = 1000

Schweinehund Max LP = 1000

LP bleiben über den gesamten Run bestehen

✅ Positive Gewohnheiten

Jede positive Gewohnheit besitzt:

Disziplin (Start: 1)

Vernachlässigung (Start: 1)

Wenn gemacht:

Disziplin +1

Schweinehund erhält Schaden

Wenn nicht gemacht:

Vernachlässigung +1

Schweinehund heilt sich um Vernachlässigung

⚔️ Schadensberechnung

Rohschaden = Summe aller Disziplin-Werte

Effektiver Schaden wird durch eine Soft-Cap-Funktion berechnet.

Warum?

Unbegrenzte Gewohnheiten sind erlaubt

Aber mehr Gewohnheiten dürfen nicht linear zum Sieg führen

Abnehmender Grenznutzen verhindert Exploits

❌ Negative Gewohnheiten

Jede negative Gewohnheit besitzt:

Drang (Startwert z.B. 10)

Kontrolle (Startwert 0)

Wenn gemacht:

Spieler erhält Schaden = Drang

Drang +1

Kontrolle = 0

Wenn nicht gemacht:

Kontrolle +1

Spieler heilt sich um Kontrolle

Drang wächst unbegrenzt.

🛡️ Schild (Login-Streak)

+1 pro Anmeldung

Max 10

Blockt Schaden linear

Zerfällt bei Nicht-Anmeldung sofort auf 0

Blockt keinen Zorn-Schaden

😡 Zorn (Nicht-Anmeldung)

Wenn nicht angemeldet:

Zorn +1 (max 10)

Schild = 0

Spieler erhält Schaden = Zorn

Schweinehund heilt sich um Zorn

Wenn angemeldet:

Zorn −1

Zorn-Schaden ignoriert Schild.

🔥 Zusätzliche Härte

Wenn Schweinehund bei (nahe) Max LP:

Zorn-Schaden ×2

Das verhindert frühe Passivität.

⚖️ BALANCING-DESIGN
🎯 Ziel: ~30 Tage pro Run

Mathematisch:

1000 LP / ~30 Tage ≈ ~33 Netto-Schaden pro Tag

Da es Heilung gibt, muss der effektive Schaden etwas höher liegen.

📈 Gewünschte Tageswerte (Durchschnitt)
Komponente	Typische Größenordnung
Effektiver Positiv-Schaden	40–60
Heilung durch Vernachlässigung	5–15
Zorn-Heilung (bei Nicht-Login)	0–10
Netto-Schaden	25–40

→ Ergibt typischerweise 20–40 Tage Run-Dauer.

🧠 Warum das stabil ist

Gute Disziplin → schneller Sieg

Schwankende Tage → längerer Run

Häufige Inaktivität → Niederlage

🧩 SYSTEMEBENEN
1️⃣ Verhaltensebene

Positive Gewohnheiten = Angriff

Negative Gewohnheiten = Selbstschaden

2️⃣ Identitätsebene

Disziplin wächst unbegrenzt

Drang wächst unbegrenzt

Muster eskalieren

3️⃣ Meta-Ebene

Anmeldung = Stabilität (Schild)

Nicht-Anmeldung = Instabilität (Zorn)

Ignoranz schwächt dich UND stärkt den Gegner

🎮 System-Eigenschaften

✔ Unbegrenzte Gewohnheiten möglich
✔ Kein linearer Exploit
✔ Soft-Cap verhindert Snowball
✔ Eskalation in beide Richtungen
✔ Fehlertoleranz vorhanden
✔ Kein „Jetzt ist alles egal“-Reset
✔ Rückkehr immer möglich

🧠 Design-Philosophie

RoutinenRPG ist keine To-Do-App.

Es ist eine:

Self-Development Engine
die Identitätsbildung durch Wiederholung modelliert.

Gelegentliche Fehler sind okay.
Wiederholte Muster werden spürbar.
Ignoranz wird teuer.

🎯 Aktueller Zustand

Du hast jetzt ein:

Mathematisch stabiles System

Psychologisch durchdachtes System

Skalierbares System

MVP-fähiges System

Erweiterbares System (XP, Prestige später)

Wenn du willst, können wir als nächstes:

🔍 Das System einmal kritisch angreifen („Wo könnte es kippen?“)

📐 Eine finale vereinfachte MVP-Version definieren

🧱 Die Architektur exakt darauf zuschneiden

📊 Ein Balancing-Simulationsmodell durchdenken

Was willst du als Nächstes vertiefen?