/**
 * LAST LIGHT - Open World Center Hub: The Forest Crossroads
 * Non-linear crossroads connecting all realms of the ancient forest:
 * - NORTH: The Forgotten Ruins (Stone Citadel)
 * - EAST: Whispering Woods (Ancient Canopy)
 * - SOUTH: The Black Marsh (Sunken Shrine)
 * - CENTER: Old Wanderer Kaelen's Campfire (Primary Safe Zone)
 */

window.LastLight = window.LastLight || {};
window.LastLight.Maps = window.LastLight.Maps || {};

(function() {
  const T = window.LastLight.Constants.TILES;
  const C = window.LastLight.Constants.COLLISION;

  const width = 32;
  const height = 24;

  const tiles = new Array(width * height).fill(T.GRASS);
  const collision = new Array(width * height).fill(C.NONE);

  // Outer borders with 4 cardinal road openings
  for (let x = 0; x < width; x++) {
    // North Opening at x = 14..17
    if (x < 14 || x > 17) {
      collision[x] = C.SOLID;
    }
    // South Opening at x = 14..17
    if (x < 14 || x > 17) {
      collision[(height - 1) * width + x] = C.SOLID;
    }
  }
  for (let y = 0; y < height; y++) {
    // West Opening at y = 10..13 (leads to hidden grove)
    if (y < 10 || y > 13) {
      collision[y * width] = C.SOLID;
    }
    // East Opening at y = 10..13 (leads to Whispering Woods)
    if (y < 10 || y > 13) {
      collision[y * width + (width - 1)] = C.SOLID;
    }
  }

  // Crossroad Dirt Roads (North-South & East-West intersecting at center)
  // North-South avenue
  for (let y = 0; y < height; y++) {
    for (let x = 14; x <= 17; x++) {
      tiles[y * width + x] = T.DIRT;
    }
  }
  // East-West avenue
  for (let x = 0; x < width; x++) {
    for (let y = 10; y <= 13; y++) {
      tiles[y * width + x] = T.DIRT;
    }
  }

  // Central Stone Plaza around Campfire (x=13..18, y=9..14)
  for (let y = 9; y <= 14; y++) {
    for (let x = 13; x <= 18; x++) {
      tiles[y * width + x] = T.STONE;
      collision[y * width + x] = C.SAFE_ZONE; // Campfire sanctuary
    }
  }

  // Dense Tree clusters in the 4 quadrants
  const treeClusters = [
    // NW Quadrant
    [3, 3], [4, 4], [5, 3], [7, 5], [8, 3], [10, 4], [4, 7], [6, 8],
    // NE Quadrant
    [21, 3], [23, 4], [25, 3], [27, 5], [22, 7], [25, 7],
    // SW Quadrant
    [3, 16], [5, 17], [7, 16], [4, 20], [6, 19], [9, 18], [10, 20],
    // SE Quadrant
    [21, 17], [23, 16], [26, 17], [28, 18], [22, 20], [25, 20]
  ];

  treeClusters.forEach(([tx, ty]) => {
    if (tx < width && ty < height) {
      collision[ty * width + tx] = C.SOLID;
    }
  });

  window.LastLight.Maps['forest_edge'] = {
    id: 'forest_edge',
    name: 'The Forest Crossroads',
    regionName: 'CENTRAL CROSSROADS',
    subRegion: 'Old Wanderer’s Sanctuary',
    drainRate: window.LastLight.Constants.DRAIN_RATES.NORMAL_FOREST,
    width: width,
    height: height,
    playerStart: { x: 15 * 32, y: 12 * 32 },
    tiles: tiles,
    collision: collision,

    lightSources: [
      { x: 15 * 32 + 16, y: 11 * 32 + 16, radius: 150 } // Central Bonfire
    ],

    objects: [
      // Primary Bonfire (Central Safe Zone)
      {
        id: 'camp_fire_central',
        type: 'CAMPFIRE',
        x: 15 * 32,
        y: 11 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "The Central Bonfire. Safe sanctuary. The lantern does not drain here, and wounds slowly heal."
      },
      // Old Wanderer Kaelen NPC
      {
        id: 'npc_traveler',
        type: 'NPC',
        x: 16 * 32,
        y: 10 * 32,
        width: 32,
        height: 32,
        interactable: true,
        dialogueId: 'intro_traveler',
        inspectText: "Speak with Old Wanderer Kaelen."
      },
      // Crossroads Signpost
      {
        id: 'signpost_crossroads',
        type: 'SIGN',
        x: 17 * 32,
        y: 13 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "CROSSROADS SIGN: [NORTH: Forgotten Ruins] [EAST: Whispering Woods] [SOUTH: Black Marsh] [WEST: Ashen Glade]"
      },
      // First Lore: Fleeing Note
      {
        id: 'lore_note_1',
        type: 'LORE',
        loreKey: 'letter_fleeing',
        x: 9 * 32,
        y: 9 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Inspect the abandoned traveler's satchel."
      },
      // Decorative Trees
      { type: 'DECOR', sprite: 'obj_pine_tree', x: 4 * 32, y: 2 * 32 },
      { type: 'DECOR', sprite: 'obj_pine_tree', x: 22 * 32, y: 2 * 32 },
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 5 * 32, y: 16 * 32 },
      { type: 'DECOR', sprite: 'obj_pine_tree', x: 24 * 32, y: 16 * 32 }
    ],

    fuel: [
      { id: 'fuel_hub_1', type: 'SMALL', x: 12 * 32, y: 10 * 32, amount: 10 },
      { id: 'fuel_hub_2', type: 'MEDIUM', x: 19 * 32, y: 10 * 32, amount: 20 },
      { id: 'fuel_hub_west', type: 'LARGE', x: 2 * 32, y: 11 * 32, amount: 30 }
    ],

    items: [
      { id: 'herb_hub', type: 'item_herb', itemId: 'herb', name: 'Moon-Herb', icon: '🌿', x: 18 * 32, y: 9 * 32, description: 'Restores 1 Heart of life.' }
    ],

    enemies: [],

    // Seamless Open-World Exits in all 4 Directions!
    triggers: [
      // NORTH EXIT ➔ The Forgotten Ruins
      {
        x: 14 * 32,
        y: 0,
        w: 4 * 32,
        h: 32,
        targetMap: 'forgotten_ruins',
        targetX: 18 * 32,
        targetY: 27 * 32,
        message: "North Path ➔ Entering The Forgotten Ruins"
      },
      // EAST EXIT ➔ Whispering Woods
      {
        x: (width - 1) * 32,
        y: 10 * 32,
        w: 32,
        h: 4 * 32,
        targetMap: 'whispering_woods',
        targetX: 2 * 32,
        targetY: 10 * 32,
        message: "East Path ➔ Entering Whispering Woods"
      },
      // SOUTH EXIT ➔ The Black Marsh
      {
        x: 14 * 32,
        y: (height - 1) * 32,
        w: 4 * 32,
        h: 32,
        targetMap: 'black_marsh',
        targetX: 18 * 32,
        targetY: 2 * 32,
        message: "South Path ➔ Entering The Black Marsh"
      }
    ]
  };
})();
