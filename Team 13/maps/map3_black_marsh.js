/**
 * LAST LIGHT - Map 3: The Black Marsh
 * Cursed terrain (1.5x fuel drain), slowing mud, river with broken bridge,
 * Root Beast guardian, and Ancient Light Keeper Shrine safe zone.
 */

window.LastLight = window.LastLight || {};
window.LastLight.Maps = window.LastLight.Maps || {};

(function() {
  const T = window.LastLight.Constants.TILES;
  const C = window.LastLight.Constants.COLLISION;

  const width = 38;
  const height = 28;

  const tiles = new Array(width * height).fill(T.MUD);
  const collision = new Array(width * height).fill(C.SLOW); // Base marsh mud slows player

  // Borders
  for (let x = 0; x < width; x++) {
    if (x < 16 || x > 20) {
      collision[x] = C.SOLID; // Top entrance from Map 2 at x=16..20
    }
    collision[(height - 1) * width + x] = C.SOLID;
  }
  for (let y = 0; y < height; y++) {
    collision[y * width] = C.SOLID;
    if (y < 12 || y > 16) {
      collision[y * width + (width - 1)] = C.SOLID; // East exit to Ruins at y=12..16
    }
  }

  // Ancient North River cutting across at y = 10..12
  for (let y = 10; y <= 12; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      tiles[idx] = T.WATER_DEEP;
      collision[idx] = C.WATER;
    }
  }

  // Broken Bridge at x = 18..19, y = 10..12
  // Initially broken (missing center plank at y=11)
  tiles[10 * width + 18] = T.WOOD_PLANK;
  tiles[10 * width + 19] = T.WOOD_PLANK;
  tiles[12 * width + 18] = T.WOOD_PLANK;
  tiles[12 * width + 19] = T.WOOD_PLANK;
  // Center is water until repaired
  tiles[11 * width + 18] = T.WATER_DEEP;
  tiles[11 * width + 19] = T.WATER_DEEP;
  collision[11 * width + 18] = C.WATER;
  collision[11 * width + 19] = C.WATER;

  // Marsh islands & paths of firmer stone
  for (let x = 14; x <= 24; x++) {
    for (let y = 18; y <= 24; y++) {
      const idx = y * width + x;
      tiles[idx] = T.MOSSY_STONE;
      collision[idx] = C.NONE; // Firm ground
    }
  }

  // Shrine Safe Zone (x=17..21, y=20..23)
  for (let y = 20; y <= 23; y++) {
    for (let x = 17; x <= 21; x++) {
      collision[y * width + x] = C.SAFE_ZONE;
    }
  }

  window.LastLight.Maps['black_marsh'] = {
    id: 'black_marsh',
    name: 'The Black Marsh',
    chapter: 3,
    drainRate: window.LastLight.Constants.DRAIN_RATES.CURSED_MARSH,
    width: width,
    height: height,
    playerStart: { x: 18 * 32, y: 2 * 32 },
    tiles: tiles,
    collision: collision,

    lightSources: [
      { x: 19 * 32 + 16, y: 21 * 32 + 16, radius: 140 } // Ancient shrine warm beacon
    ],

    objects: [
      // Abandoned Fisherman's shack (holds bridge repair planks at x=5, y=5)
      {
        id: 'chest_planks',
        type: 'CHEST',
        x: 5 * 32,
        y: 5 * 32,
        width: 32,
        height: 32,
        interactable: true,
        opened: false,
        givesItem: {
          id: 'marsh_planks',
          name: 'Sturdy Marsh Planks',
          type: 'QUEST',
          icon: '🪵',
          description: 'Solid wooden timber suitable for bridging the broken river chasm.'
        },
        inspectText: "Open the abandoned supply cache."
      },
      // Broken Bridge interaction point
      {
        id: 'bridge_repair_point',
        type: 'BRIDGE_SPOT',
        x: 18 * 32,
        y: 11 * 32,
        width: 64,
        height: 32,
        repaired: false,
        interactable: true,
        inspectText: "Inspect the broken bridge gap. Requires Sturdy Marsh Planks to bridge."
      },
      // Ancient Light Keeper Shrine (Safe Zone Campfire)
      {
        id: 'shrine_campfire',
        type: 'CAMPFIRE',
        x: 19 * 32,
        y: 21 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "The Light Keeper’s Sanctuary. Fuel drain halts completely here."
      },
      // Ancient Stele of the Light Keeper
      {
        id: 'lore_stele_keeper',
        type: 'LORE',
        loreKey: 'record_light_keeper',
        dialogueId: 'stele_keeper_communion',
        x: 19 * 32,
        y: 19 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Translate the glowing Stele of the Light Keeper."
      },
      // Gnarled trees
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 8 * 32, y: 4 * 32 },
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 28 * 32, y: 6 * 32 },
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 10 * 32, y: 22 * 32 },
      { type: 'DECOR', sprite: 'obj_dead_tree', x: 28 * 32, y: 20 * 32 },
      // Celestial Mire Ember (Relic required for the Celestial Gate)
      {
        id: 'relic_mire_ember',
        type: 'EMBER_RELIC',
        emberId: 'mire_ember',
        name: 'Mire Ember',
        x: 21 * 32,
        y: 21 * 32,
        width: 32,
        height: 32,
        collected: false,
        interactable: true,
        inspectText: "Claim the celestial Mire Ember of the Sunken Sanctuary."
      }
    ],

    fuel: [
      { id: 'fuel_marsh_1', type: 'MEDIUM', x: 6 * 32, y: 8 * 32, amount: 20 },
      { id: 'fuel_marsh_2', type: 'LARGE', x: 32 * 32, y: 4 * 32, amount: 30 },
      { id: 'fuel_marsh_3', type: 'MEDIUM', x: 25 * 32, y: 15 * 32, amount: 20 },
      { id: 'fuel_marsh_ancient', type: 'ANCIENT', x: 15 * 32, y: 23 * 32, amount: 45 }
    ],

    items: [
      { id: 'herb_marsh', type: 'item_herb', itemId: 'herb', name: 'Moon-Herb', icon: '🌿', x: 22 * 32, y: 23 * 32, description: 'Restores 1 Heart of life.' }
    ],

    enemies: [
      // Root Beast guardian guarding the eastern corridor to ruins!
      { type: 'ROOT_BEAST', x: 26 * 32, y: 14 * 32 },
      { type: 'STALKER', x: 10 * 32, y: 16 * 32 },
      { type: 'WHISPER', x: 22 * 32, y: 8 * 32 }
    ],

    triggers: [
      // North transition back to The Forest Crossroads (Hub)
      {
        x: 16 * 32,
        y: 0,
        w: 5 * 32,
        h: 32,
        targetMap: 'forest_edge',
        targetX: 16 * 32,
        targetY: 21 * 32,
        message: "North Path ➔ Returning to The Forest Crossroads..."
      },
      // East transition to The Forgotten Ruins
      {
        x: (width - 1) * 32,
        y: 12 * 32,
        w: 32,
        h: 4 * 32,
        targetMap: 'forgotten_ruins',
        targetX: 2 * 32,
        targetY: 14 * 32,
        message: "East Path ➔ Approaching The Forgotten Ruins..."
      }
    ]
  };
})();
