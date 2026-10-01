/**
 * LAST LIGHT - Constants & Configuration
 * Game Theme: Against the Clock
 */

window.LastLight = window.LastLight || {};

window.LastLight.Constants = {
  // Canvas & Display
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 640,
  TILE_SIZE: 32,

  // Lantern & Timer Configuration
  STARTING_FUEL: 120, // 120 seconds of light
  MAX_FUEL: 150,
  
  // Fuel Drain Rates (seconds per real second)
  DRAIN_RATES: {
    SAFE_ZONE: 0.0,
    NORMAL_FOREST: 1.0,
    DARK_FOREST: 1.25,
    CURSED_MARSH: 1.5,
    DEEP_DARKNESS: 2.0
  },
  
  SPRINT_DRAIN_MODIFIER: 0.5, // Extra fuel drain per second while sprinting
  LANTERN_PULSE_COST: 4.0,   // Fuel consumed when releasing a lantern burst stun

  // Light Thresholds (in seconds of fuel)
  THRESHOLD_NORMAL: 90,
  THRESHOLD_WARNING: 60,
  THRESHOLD_SEVERE: 30,
  THRESHOLD_CRITICAL: 10,

  // Player Speeds (pixels per second)
  PLAYER_WALK_SPEED: 120,
  PLAYER_SPRINT_SPEED: 180,
  PLAYER_MUD_SPEED: 65,

  // Health
  MAX_HEALTH: 3,
  INVULNERABILITY_TIME: 1.5, // seconds after taking damage

  // Tile Types
  TILES: {
    EMPTY: 0,
    GRASS: 1,
    DARK_GRASS: 2,
    DIRT: 3,
    MUD: 4,
    STONE: 5,
    MOSSY_STONE: 6,
    DEAD_GRASS: 7,
    LEAVES: 8,
    WATER_SHALLOW: 9,
    WATER_DEEP: 10,
    WOOD_PLANK: 11,
    RUIN_FLOOR: 12,
    VOID_FLOOR: 13
  },

  // Collision Flags
  COLLISION: {
    NONE: 0,
    SOLID: 1,       // Wall / Tree / Rock (Cannot pass)
    SLOW: 2,        // Mud / Swamp (Slows movement)
    DAMAGE: 3,      // Briars / Spikes (Damages player)
    WATER: 4,       // Deep water (Cannot pass without bridge)
    TRIGGER: 5,     // Zone switch / Cutscene trigger
    INTERACTION: 6, // Chests / Shrines / Signs / Doors
    SAFE_ZONE: 7    // No fuel consumption
  },

  // Fuel Pickups
  FUEL_TYPES: {
    SMALL: { name: 'Small Ember Vial', fuel: 10, color: '#f39c12' },
    MEDIUM: { name: 'Refined Oil Flask', fuel: 20, color: '#e67e22' },
    LARGE: { name: 'Luminous Core', fuel: 30, color: '#d35400' },
    ANCIENT: { name: 'Ancient Eternal Flame', fuel: 45, color: '#f1c40f' }
  },

  // Color Palette
  PALETTE: {
    BG_DARK: '#07090e',
    OBSIDIAN: '#0d131a',
    DEEP_FOREST: '#112217',
    MOSS_GREEN: '#2d5a3f',
    SWAMP_TEAL: '#163236',
    ANCIENT_STONE: '#4a535b',
    LANTERN_CORE: '#fff7d6',
    LANTERN_WARMTH: '#ffaa33',
    LANTERN_OUTER: '#e65c00',
    LANTERN_GLOW: 'rgba(255, 170, 51, 0.25)',
    DARKNESS_OVERLAY: '#05070b',
    UI_GOLD: '#f5c542',
    UI_CRIMSON: '#e74c3c',
    UI_BORDER: '#8c7b58',
    UI_BG: '#12161f',
    VOID_PURPLE: '#8e44ad'
  },

  // Scoring Points
  POINTS: {
    EXPLORE_AREA: 100,
    FIND_FUEL: 50,
    DISCOVER_CLUE: 150,
    SOLVE_PUZZLE: 250,
    HELP_NPC: 300,
    FIND_SECRET: 500,
    DEFEAT_CREATURE: 200,
    COMPLETE_CHAPTER: 1000,
    FUEL_MULTIPLIER: 10 // Remaining fuel * 10
  }
};
