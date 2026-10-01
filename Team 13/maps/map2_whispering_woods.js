/**
 * LAST LIGHT - Map 2: Whispering Woods
 * Darker forest, higher fuel drain (1.25x), central pond, Shadow Stalkers & Whispers,
 * hidden clearing with Lore Tablet.
 */

window.LastLight = window.LastLight || {};
window.LastLight.Maps = window.LastLight.Maps || {};

(function() {
  const T = window.LastLight.Constants.TILES;
  const C = window.LastLight.Constants.COLLISION;

  const width = 36;
  const height = 26;

  const tiles = new Array(width * height).fill(T.DARK_GRASS);
  const collision = new Array(width * height).fill(C.NONE);

  // Borders
  for (let x = 0; x < width; x++) {
    collision[x] = C.SOLID;
    if (x < 16 || x > 20) {
      collision[(height - 1) * width + x] = C.SOLID; // Exit opening at bottom x=16..20
    }
  }
  for (let y = 0; y < height; y++) {
    if (y < 8 || y > 12) {
      collision[y * width] = C.SOLID; // Entrance from Map 1 at left y=8..12
    }
    collision[y * width + (width - 1)] = C.SOLID;
  }

  // Winding Dirt Paths
  for (let x = 1; x <= 12; x++) {
    tiles[10 * width + x] = T.DIRT;
  }
  // Fork up toward secret grove (x=28, y=5)
  for (let x = 12; x <= 28; x++) {
    tiles[6 * width + x] = T.DIRT;
  }
  // Fork down toward marsh exit
  for (let y = 10; y < height - 1; y++) {
    tiles[y * width + 18] = T.DIRT;
  }

  // Central Pond (Water tiles with deep water in center)
  for (let py = 12; py <= 18; py++) {
    for (let px = 8; px <= 14; px++) {
      const idx = py * width + px;
      if (py >= 14 && py <= 16 && px >= 10 && px <= 12) {
        tiles[idx] = T.WATER_DEEP;
        collision[idx] = C.WATER;
      } else {
        tiles[idx] = T.WATER_SHALLOW;
        collision[idx] = C.SLOW; // Shallow edge slows player
      }
    }
  }

  // Dense Tree Clusters (Solid obstacles)
  const trees = [
    [4, 4], [5, 4], [6, 5], [4, 15], [5, 17], [6, 18],
    [16, 4], [17, 3], [18, 4], [20, 2], [22, 4],
    [22, 12], [23, 14], [24, 15], [26, 13],
    [8, 22], [10, 23], [12, 21], [24, 22], [26, 23],
    [30, 8], [31, 9], [32, 10], [30, 16], [32, 18]
  ];

  trees.forEach(([tx, ty]) => {
    if (tx < width && ty < height) {
      collision[ty * width + tx] = C.SOLID;
    }
  });

  window.LastLight.Maps['whispering_woods'] = {
    id: 'whispering_woods',
    name: 'Whispering Woods',
    chapter: 2,
    drainRate: window.LastLight.Constants.DRAIN_RATES.DARK_FOREST,
    width: width,
    height: height,
    playerStart: { x: 2 * 32, y: 10 * 32 },
    tiles: tiles,
    collision: collision,

    lightSources: [
      { x: 29 * 32, y: 5 * 32, radius: 90 } // Mystical lore shrine glow
    ],

    objects: [
      // Lore Tablet in secret grove (top right)
      {
        id: 'lore_tablet_woods',
        type: 'LORE',
        loreKey: 'memory_voices_marsh',
        x: 29 * 32,
        y: 5 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Listen to the whispering stone obelisk."
      },
      // Alchemist's research log
      {
        id: 'lore_alchemist_log',
        type: 'LORE',
        loreKey: 'letter_alchemist',
        x: 16 * 32,
        y: 8 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Read the fallen alchemist's parchment."
      },
      // Decorative Trees
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 5 * 32, y: 3 * 32 },
      { type: 'DECOR', sprite: 'obj_pine_tree', x: 17 * 32, y: 2 * 32 },
      { type: 'DECOR', sprite: 'obj_pine_tree', x: 23 * 32, y: 11 * 32 },
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 30 * 32, y: 15 * 32 },
      // Celestial Echo Ember (Relic required for the Celestial Gate)
      {
        id: 'relic_echo_ember',
        type: 'EMBER_RELIC',
        emberId: 'echo_ember',
        name: 'Echo Ember',
        x: 27 * 32,
        y: 6 * 32,
        width: 32,
        height: 32,
        collected: false,
        interactable: true,
        inspectText: "Claim the celestial Echo Ember of the Weeping Canopy."
      }
    ],

    fuel: [
      { id: 'fuel_woods_1', type: 'SMALL', x: 14 * 32, y: 6 * 32, amount: 10 },
      { id: 'fuel_woods_2', type: 'MEDIUM', x: 31 * 32, y: 6 * 32, amount: 20 },
      { id: 'fuel_woods_3', type: 'SMALL', x: 12 * 32, y: 21 * 32, amount: 10 },
      { id: 'fuel_woods_4', type: 'LARGE', x: 20 * 32, y: 16 * 32, amount: 30 }
    ],

    items: [
      { id: 'herb_woods', type: 'item_herb', itemId: 'herb', name: 'Moon-Herb', icon: '🌿', x: 28 * 32, y: 4 * 32, description: 'Restores 1 Heart of life.' }
    ],

    enemies: [
      { type: 'STALKER', x: 15 * 32, y: 11 * 32 },
      { type: 'WHISPER', x: 24 * 32, y: 7 * 32 },
      { type: 'WHISPER', x: 16 * 32, y: 19 * 32 }
    ],

    triggers: [
      // Transition West back to The Forest Crossroads (Hub)
      {
        x: 0,
        y: 8 * 32,
        w: 32,
        h: 4 * 32,
        targetMap: 'forest_edge',
        targetX: 29 * 32,
        targetY: 11 * 32,
        message: "West Path ➔ Returning to The Forest Crossroads..."
      },
      // Transition South to The Black Marsh
      {
        x: 16 * 32,
        y: (height - 1) * 32,
        w: 5 * 32,
        h: 32,
        targetMap: 'black_marsh',
        targetX: 18 * 32,
        targetY: 2 * 32,
        message: "South Path ➔ Entering The Black Marsh..."
      }
    ]
  };
})();
