/**
 * LAST LIGHT - Map 4: The Forgotten Ruins
 * Ancient stone temple, locked celestial gate, interactive Rune Altar &
 * Light Mirror beam puzzles, deep lore revelation about the Devouring Star.
 */

window.LastLight = window.LastLight || {};
window.LastLight.Maps = window.LastLight.Maps || {};

(function() {
  const T = window.LastLight.Constants.TILES;
  const C = window.LastLight.Constants.COLLISION;

  const width = 36;
  const height = 30;

  const tiles = new Array(width * height).fill(T.STONE);
  const collision = new Array(width * height).fill(C.NONE);

  // Outer solid walls
  for (let x = 0; x < width; x++) {
    if (x < 16 || x > 20) {
      collision[x] = C.SOLID; // Exit North to Heart of Darkness at x=16..20
      collision[(height - 1) * width + x] = C.SOLID; // Exit South to Forest Edge at x=16..20
    }
  }
  for (let y = 0; y < height; y++) {
    if (y < 12 || y > 16) {
      collision[y * width] = C.SOLID; // Entrance West from Marsh at y=12..16
    }
    collision[y * width + (width - 1)] = C.SOLID;
  }

  // Ruin interior wall partitions dividing chambers
  for (let y = 4; y < 26; y++) {
    if (y !== 14 && y !== 15) {
      collision[y * width + 12] = C.SOLID; // West chamber wall
      collision[y * width + 24] = C.SOLID; // East chamber wall
      tiles[y * width + 12] = T.RUIN_FLOOR;
      tiles[y * width + 24] = T.RUIN_FLOOR;
    }
  }

  // Inner sanctum barrier at y = 8 across the central hall (x=13..23)
  for (let x = 13; x <= 23; x++) {
    if (x !== 18) {
      collision[8 * width + x] = C.SOLID;
    }
  }
  // Celestial Gate sits at x=18, y=8
  collision[8 * width + 18] = C.SOLID; // Initially locked

  window.LastLight.Maps['forgotten_ruins'] = {
    id: 'forgotten_ruins',
    name: 'The Forgotten Ruins',
    chapter: 4,
    drainRate: window.LastLight.Constants.DRAIN_RATES.NORMAL_FOREST, // Stone shelter slightly slows drain
    width: width,
    height: height,
    playerStart: { x: 2 * 32, y: 14 * 32 },
    tiles: tiles,
    collision: collision,

    lightSources: [
      { x: 18 * 32 + 16, y: 14 * 32 + 16, radius: 110 }
    ],

    objects: [
      // Locked Celestial Gate
      {
        id: 'gate_ruins',
        type: 'GATE',
        sprite: 'obj_gate_locked',
        x: 18 * 32,
        y: 8 * 32,
        width: 32,
        height: 32,
        locked: true,
        interactable: true,
        inspectText: "The Celestial Gate is sealed by two ancient mechanisms: The Rune Altar and the Mirror Beam."
      },
      // Mechanism 1: Rune Altar (West Chamber at x=6, y=14)
      {
        id: 'altar_puzzle_trigger',
        type: 'PUZZLE_ALTAR',
        x: 6 * 32,
        y: 14 * 32,
        width: 32,
        height: 32,
        solved: false,
        interactable: true,
        inspectText: "Examine the Celestial Rune Altar."
      },
      // Mechanism 2: Light Mirror Pedestal (East Chamber at x=30, y=14)
      {
        id: 'mirror_puzzle_trigger',
        type: 'PUZZLE_MIRROR',
        x: 30 * 32,
        y: 14 * 32,
        width: 32,
        height: 32,
        solved: false,
        interactable: true,
        inspectText: "Examine the Prismatic Mirror Mechanism."
      },
      // Ancient Tablet of the Great Ward (The Truth Lore at x=18, y=12)
      {
        id: 'lore_tablet_truth',
        type: 'LORE',
        loreKey: 'record_celestial_containment',
        x: 18 * 32,
        y: 12 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Decipher the Tablet of the Great Ward."
      },
      // Rune poem inscription in West chamber
      {
        id: 'lore_poem',
        type: 'LORE',
        loreKey: 'discovery_altar_poem',
        x: 6 * 32,
        y: 10 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Read the engraved poem of the Eclipse."
      },
      // Celestial Solar Ember (Relic required for the Celestial Gate)
      {
        id: 'relic_solar_ember',
        type: 'EMBER_RELIC',
        emberId: 'solar_ember',
        name: 'Solar Ember',
        x: 30 * 32,
        y: 6 * 32,
        width: 32,
        height: 32,
        collected: false,
        interactable: true,
        inspectText: "Claim the celestial Solar Ember of the Ancient Vault."
      }
    ],

    fuel: [
      { id: 'fuel_ruins_1', type: 'MEDIUM', x: 6 * 32, y: 22 * 32, amount: 20 },
      { id: 'fuel_ruins_2', type: 'LARGE', x: 30 * 32, y: 22 * 32, amount: 30 },
      { id: 'fuel_ruins_ancient', type: 'ANCIENT', x: 18 * 32, y: 5 * 32, amount: 45 }
    ],

    items: [
      { id: 'herb_ruins', type: 'item_herb', itemId: 'herb', name: 'Moon-Herb', icon: '🌿', x: 30 * 32, y: 10 * 32, description: 'Restores 1 Heart of life.' }
    ],

    enemies: [
      { type: 'STALKER', x: 8 * 32, y: 18 * 32 },
      { type: 'WHISPER', x: 28 * 32, y: 18 * 32 }
    ],

    triggers: [
      // South transition back to The Forest Crossroads (Hub)
      {
        x: 16 * 32,
        y: (height - 1) * 32,
        w: 5 * 32,
        h: 32,
        targetMap: 'forest_edge',
        targetX: 16 * 32,
        targetY: 2 * 32,
        message: "South Path ➔ Returning to The Forest Crossroads..."
      },
      // West transition back to Black Marsh
      {
        x: 0,
        y: 12 * 32,
        w: 32,
        h: 5 * 32,
        targetMap: 'black_marsh',
        targetX: 36 * 32,
        targetY: 14 * 32,
        message: "West Path ➔ Returning to The Black Marsh..."
      },
      // North transition into Heart of Darkness
      {
        x: 16 * 32,
        y: 0,
        w: 5 * 32,
        h: 32,
        targetMap: 'heart_of_darkness',
        targetX: 18 * 32,
        targetY: 26 * 32,
        message: "Descending into The Heart of Darkness..."
      }
    ]
  };
})();
