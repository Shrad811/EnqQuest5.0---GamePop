/**
 * LAST LIGHT - Map 5: The Heart of Darkness
 * Final area: Deep supernatural darkness (2.0x fuel drain), void floor,
 * The Hollow enemy, and the climactic dialogue with the Voice of the Dark Core.
 */

window.LastLight = window.LastLight || {};
window.LastLight.Maps = window.LastLight.Maps || {};

(function() {
  const T = window.LastLight.Constants.TILES;
  const C = window.LastLight.Constants.COLLISION;

  const width = 36;
  const height = 30;

  const tiles = new Array(width * height).fill(T.VOID_FLOOR);
  const collision = new Array(width * height).fill(C.NONE);

  // Outer void abyss
  for (let x = 0; x < width; x++) {
    collision[x] = C.SOLID;
    if (x < 16 || x > 20) {
      collision[(height - 1) * width + x] = C.SOLID; // South entrance from Map 4 at x=16..20
    }
  }
  for (let y = 0; y < height; y++) {
    collision[y * width] = C.SOLID;
    collision[y * width + (width - 1)] = C.SOLID;
  }

  // Ancient Hollow pillars surrounding the sanctum
  const pillars = [
    [10, 8], [26, 8], [10, 20], [26, 20],
    [8, 14], [28, 14]
  ];
  pillars.forEach(([px, py]) => {
    collision[py * width + px] = C.SOLID;
    collision[py * width + px + 1] = C.SOLID;
  });

  // Solid bounding box for the massive 96x96 Dark Heart Tree in center (x=16..19, y=10..13)
  for (let dy = 10; dy <= 13; dy++) {
    for (let dx = 16; dx <= 19; dx++) {
      collision[dy * width + dx] = C.SOLID;
    }
  }

  window.LastLight.Maps['heart_of_darkness'] = {
    id: 'heart_of_darkness',
    name: 'The Heart of Darkness',
    chapter: 5,
    drainRate: window.LastLight.Constants.DRAIN_RATES.DEEP_DARKNESS,
    width: width,
    height: height,
    playerStart: { x: 18 * 32, y: 26 * 32 },
    tiles: tiles,
    collision: collision,

    lightSources: [
      { x: 18 * 32, y: 12 * 32, radius: 100 } // Pulsing violet ethereal glow of the Core
    ],

    objects: [
      // The Massive Ancient Dark Tree / Heart (96x96)
      {
        id: 'dark_heart_core',
        type: 'DARK_HEART',
        sprite: 'obj_dark_heart',
        x: 15 * 32,
        y: 9 * 32,
        width: 96,
        height: 96,
        interactable: true,
        dialogueId: 'final_entity_choice',
        inspectText: "Commune with the Voice of the Dark Core."
      },
      // Final Lore Discovery
      {
        id: 'lore_core_truth',
        type: 'LORE',
        loreKey: 'discovery_dark_core',
        x: 18 * 32,
        y: 18 * 32,
        width: 32,
        height: 32,
        interactable: true,
        inspectText: "Touch the pulsing violet tendril."
      }
    ],

    fuel: [
      { id: 'fuel_heart_1', type: 'LARGE', x: 10 * 32, y: 14 * 32, amount: 30 },
      { id: 'fuel_heart_2', type: 'LARGE', x: 26 * 32, y: 14 * 32, amount: 30 },
      { id: 'fuel_heart_ancient', type: 'ANCIENT', x: 18 * 32, y: 22 * 32, amount: 45 }
    ],

    items: [],

    enemies: [
      // The Hollow stalks the player throughout this final abyss
      { type: 'HOLLOW', x: 12 * 32, y: 12 * 32 },
      { type: 'WHISPER', x: 24 * 32, y: 12 * 32 }
    ],

    triggers: [
      // South transition back to Forgotten Ruins
      {
        x: 16 * 32,
        y: (height - 1) * 32,
        w: 5 * 32,
        h: 32,
        targetMap: 'forgotten_ruins',
        targetX: 18 * 32,
        targetY: 2 * 32,
        message: "Retreating to The Forgotten Ruins..."
      }
    ]
  };
})();
