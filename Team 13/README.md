# LAST LIGHT — Against the Clock

> *"A strange supernatural darkness is consuming the world. You carry an ancient lantern holding only 120 seconds of light. But was the darkness actually the enemy?"*

---

## 🎮 How to Play

### Launching the Game
1. **Direct Browser Play**: Simply double-click `index.html` in your file explorer to open it directly in any modern browser (Chrome, Edge, Firefox, Brave, Safari).
2. **Local Server (Optional)**: Run `python server.py` in your terminal to launch on `http://localhost:8000` and automatically open your default browser.

### Controls
| Key | Action | Details |
|---|---|---|
| **W / A / S / D** or **Arrow Keys** | **Move** | 4-directional movement (Walk: 120 px/s, Mud: 65 px/s) |
| **Shift** | **Sprint** | Increases speed to 180 px/s, but drains +0.5s lantern fuel/sec |
| **E** | **Interact** | Inspect lore items, open chests, talk to NPCs, repair bridges, align puzzles |
| **Space** | **Lantern Pulse** | Emits a blazing flare wave that stuns nearby creatures for 2.5s (costs 4.0s of fuel) |
| **M** | **World Expedition Map** | Opens the comprehensive realm map with marked landmarks |
| **Tab / J** | **Journal / Satchel** | Opens the Lore Codex, Quests tracker, and Carried Supplies |
| **Esc** | **Pause Menu** | Pauses gameplay, options to save progress to localStorage |

---

## 🧭 Dynamic Rotating Mini Map & Old Wanderer Tracker

Located in the **top-left corner of the HUD**:
- **Dynamic Rotation**: The circular minimap rotates seamlessly in real-time with the player's facing direction so your forward heading is always pointing straight UP!
- **Rotating Compass Rose**: Accurate **N, E, S, W** cardinal markers rotate around the antique brass bezel, keeping your bearings clear in the dark.
- **Old Man's Marked Location (👴)**:
  - In *The Forest Edge*, the Old Wanderer's camp is highlighted with a **pulsing golden beacon** and a label.
  - When far away or in subsequent realms, an **edge-clamped radar arrow** on the minimap's rim points directly toward the Old Man with a live distance meter (e.g. `👴 WANDERER: 14m`).
- **Points of Interest**:
  - Safe Zone Campfires marked as glowing amber dots (`🔥`).
  - Fuel pickups marked as orange blips.
  - Realm portals marked as cyan gateways.
- **World Expedition Map (`[M]`)**: Full-screen cartography screen in the Journal codex detailing all five chapters with active "YOU ARE HERE" pins and the Old Wanderer's safe haven.

---

## ⏳ Core Gameplay & Mechanics

### 1. The 120-Second Lantern Countdown
- You start with exactly **120 seconds** of fuel.
- Fuel continuously drains outside safe zones:
  - **Normal Forest (Map 1)**: 1.0 sec / real second
  - **Dark Woods (Map 2)**: 1.25 sec / real second
  - **Cursed Marsh (Map 3)**: 1.5 sec / real second
  - **Deep Darkness (Map 5)**: 2.0 sec / real second
  - **Safe Zones (Campfires/Shrines)**: **0.0 sec** (drain pauses, health slowly regenerates)
- **Threshold Visual & Audio Shifts**:
  - `> 90s`: Warm, large illumination radius (~220px)
  - `60s Warning`: Light radius contracts (~140px), ambient tension drone elevates
  - `30s Severe`: Small tunnel vision (~100px), sub-bass heartbeat begins thumping, creature aggression radius increases
  - `10s Critical`: Sputtering flame (~60px), frantic double-heartbeat, red vignette pulses
  - `0s Extinction`: Sudden flame death, chilling darkness sequence, and Game Over

### 2. Fuel Pickups
- **Small Ember Vial**: +10 seconds
- **Refined Oil Flask**: +20 seconds
- **Luminous Core**: +30 seconds
- **Ancient Eternal Flame**: +45 seconds

### 3. Creatures & Enemy AI
1. **Shadow Stalker**: Basic chaser that prowls dark paths. Flees when exposed to strong lantern light (>50s fuel); becomes aggressive in deep darkness.
2. **Whisper**: Floating spectral wisp that swoops at the traveler, siphoning 4 seconds of lantern flame on contact.
3. **Root Beast**: Massive wooden golem guarding narrow passages and ancient shrines. High health (4 HP), immune to light intimidation, vulnerable to tactical lantern pulses.
4. **The Hollow**: Relentless, invincible nightmare inhabiting the Heart of Darkness. Teleports through shadows; the player must evade rather than fight.

### 4. Interactive Puzzles
- **Celestial Rune Altar**: Rotate ancient astrological rings to align with the lore riddle (*"When the Sun rises above the Eclipse, only the Void shall endure"*).
- **Prismatic Mirror Beam**: Rotate reflective pedestals in 90-degree increments to bounce the lantern's beam into the locked Celestial Gate.
- *Notice*: Both puzzles operate in real-time, meaning your lantern continues to burn while solving them!

---

## 🗺️ Five Narrative Levels & Chapter Progression

Each level features its own **cinematic title banner**, par completion time, star rating (⭐ ⭐ ⭐), and an **emotional story reflection** upon completion:

1. **LEVEL 1: THE FOREST EDGE — The Fading Embers of Oakhaven** (Par: 45s)
   - *"We light our fires in terror of the night, blind to the truth that stars can only breathe in the dark."*
   - **Story**: Elian leaves the grey ash of their home. Old Wanderer Kaelen passes on the ancient lantern with a heavy warning about human fear.
   - **Key Milestones**: Abandoned campsite, first fuel pickups, fleeing note, and fallen log obstacle.

2. **LEVEL 2: WHISPERING WOODS — The Weeping Canopy** (Par: 65s)
   - *"Listen closely to what you call monsters. You may hear them weeping your own mother’s song."*
   - **Story**: Dense dark foliage where the whispers of lost spirits echo through the boughs. Elian realizes the creatures recoil from light because the lantern burns them.
   - **Key Milestones**: Shadow Stalkers, siphoning Whispers, alchemist’s dropped diary, and secret grove.

3. **LEVEL 3: THE BLACK MARSH — The Sunken Sanctuary** (Par: 85s)
   - *"Without night, the seed cannot rest. Without darkness, life is consumed by fever."*
   - **Story**: Deep mire and forgotten dynasty shrines. Communing with the Stele of the Light Keeper reveals that the darkness was created as a cool blanket to save humanity from a boiling sun.
   - **Key Milestones**: River bridge repair puzzle, Root Beast guardian, and the safe Light Keeper’s Shrine.

4. **LEVEL 4: THE FORGOTTEN RUINS — The Solar Vault** (Par: 95s)
   - *"The locks were never built to keep a monster inside. They were forged to keep fire out."*
   - **Story**: Massive stone halls and locked Celestial Gate. Tablets reveal the shattering revelation: the lantern carries the dormant apocalyptic ember of the Devouring Sun.
   - **Key Milestones**: Celestial Rune Altar rotation, Prismatic Light Mirror alignment, and the Truth Tablet.

5. **LEVEL 5: THE HEART OF DARKNESS — The Loom of Night** (Par: 120s)
   - *"When the final light meets the eternal shade, the world will remember who we were."*
   - **Story**: The crystalline void where Nyra, Weaver of the Shroud, awaits. Confrontation with The Hollow and the climactic final decree of existence.
   - **Key Milestones**: The Dark Heart Tree, The Hollow stalker, and the 3 philosophical endings.

---

## 🎭 The Story & Multiple Endings

### The Philosophical Twist
Throughout your journey, discovered journals and inscriptions reveal that millennia ago, a catastrophic cosmic sun scorched the heavens. The ancient civilization sacrificed themselves to weave the living darkness as a protective shroud to seal the devouring fire asleep. The lantern you carry holds the final ember of that cataclysmic star.

### Final Choices:
- **Ending 1: The Burning Forest (Destroy the Darkness)**
  - You shatter the Core with the lantern. The darkness vanishes, but the protective containment breaks, awakening the devouring star that burns the world white.
- **Ending 2: The Silent Sanctuary (Extinguish the Lantern)**
  - You voluntarily extinguish the last flame. The guardians bow in peace, and the forest rests forever beneath the cool, protective cosmic veil.
- **Ending 3: The Light Keeper (Become the Eternal Ward)**
  - You merge flame and shadow into harmonious equilibrium, ascending as the new Light Keeper to safeguard balance between light and night.

---

## 🛠️ Technical Architecture

- **Engine**: Zero-dependency vanilla HTML5 Canvas + Web Audio API + ES6 Modular JavaScript.
- **Visuals**: Procedural pixel-art generator rendering crisp 16-bit retro sprites and tiles directly to canvas with transparency, plus exported PNG sprite sheets in `assets/`.
- **Audio**: 100% procedural Web Audio synthesizer creating realistic howling wind, dark ambient drones, burning lantern crackles, dynamic heartbeats, footstep variations, creature growls, and ending themes without loading external MP3 files.
- **Save System**: Automatically records progress and allows manual saves via browser `localStorage`.
- **Scoring**: Calculates points based on area exploration, fuel scavenged, clues recovered, puzzles resolved, and remaining fuel multipliers.
