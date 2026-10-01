/**
 * LAST LIGHT - Levels & Narrative Architecture
 * Contains level progression metadata, emotional narrative reflections,
 * chapter intro cinematics, par times, and star ratings.
 */

window.LastLight = window.LastLight || {};

const LEVELS_CONFIG = [
  {
    level: 1,
    id: 'forest_edge',
    title: 'LEVEL 1: THE FOREST EDGE',
    subtitle: 'The Fading Embers of Oakhaven',
    mapId: 'forest_edge',
    quote: `"We light our fires in terror of the night, blind to the truth that stars can only breathe in the dark."`,
    introStory: `Elian stepped beyond the tree line, their boots heavy with the grey ash of Oakhaven. The village was gone—not burnt by fire, but swallowed by an unnatural silence that choked the morning dawn. By the dying roadside campfire, Kaelen the Old Wanderer waited with the ancient lantern. "Take it, child," the old man rasped. "You have 120 seconds of light. Seek the origin before your spark turns to cold iron."`,
    reflection: `Resting at the border of the woods, Elian clutches the warm brass of the lantern. The abandoned wagons along the path weren't overturned by monsters—they were abandoned by panicked villagers fleeing shadows that never gave chase. The fear within their own minds had done more damage than the gloom ever could.`,
    primaryObjective: "Converse with Old Wanderer Kaelen and traverse the eastern boundary.",
    parTime: 45, // seconds for 3 stars
    totalLore: 1,
    drainRate: 1.0,
    nextLevelId: 'whispering_woods'
  },
  {
    level: 2,
    id: 'whispering_woods',
    title: 'LEVEL 2: WHISPERING WOODS',
    subtitle: 'The Weeping Canopy',
    mapId: 'whispering_woods',
    quote: `"Listen closely to what you call monsters. You may hear them weeping your own mother’s song."`,
    introStory: `The canopy knit together into an obsidian vault, blotting out what little twilight remained. Here, the air hummed with faint, breathy murmurs. The shadows did not growl; they sighed. Scholar Valen's dropped satchels litter the damp moss, containing frantic scribbles: 'The creatures do not hunt to feed. They recoil from the torch. Why does our light burn them so?'`,
    reflection: `Passing the dark mere, Elian's heart aches with sudden understanding. The Whispers that circled their lantern weren't seeking blood—they were desperate spirits reaching toward warmth, only to be seared and scattered by the lantern's harsh glare. Elian wonders if every beast they warded off was merely crying for peace.`,
    primaryObjective: "Navigate the deep thicket, survive the Whispers, and reach the marsh gate.",
    parTime: 65,
    totalLore: 2,
    drainRate: 1.25,
    nextLevelId: 'black_marsh'
  },
  {
    level: 3,
    id: 'black_marsh',
    title: 'LEVEL 3: THE BLACK MARSH',
    subtitle: 'The Sunken Sanctuary',
    mapId: 'black_marsh',
    quote: `"Without night, the seed cannot rest. Without darkness, life is consumed by fever."`,
    introStory: `The ground dissolved into black mire and stagnant mirrored pools. In the distance, an ancient stone stele pulsed with warm amber light. Millennia ago, this marsh was a cradle of the First Dynasty—priests and scholars who witnessed the heavens ignite with a merciless devouring fire. Here, they prayed not for sun, but for the mercy of a sheltering night.`,
    reflection: `Standing before the Light Keeper’s stele, the reality of the ancient world pierces through Elian's grief. The ancient texts speak of the Great Solar Scorch—a cataclysm where the sky burned without dusk until rivers boiled. The 'darkness' wasn't an invasion. It was a cradle spun by desperate hands to protect the living earth from being incinerated.`,
    primaryObjective: "Scavenge bridge planks, bypass the Root Beast, and unseal the temple road.",
    parTime: 85,
    totalLore: 1,
    drainRate: 1.5,
    nextLevelId: 'forgotten_ruins'
  },
  {
    level: 4,
    id: 'forgotten_ruins',
    title: 'LEVEL 4: THE FORGOTTEN RUINS',
    subtitle: 'The Solar Vault',
    mapId: 'forgotten_ruins',
    quote: `"The locks were never built to keep a monster inside. They were forged to keep fire out."`,
    introStory: `Monolithic stone columns towered into the shadows, carved with celestial glyphs of eclipses and stars. Elian reached the Great Gate of the Solar Vault. The mechanisms required harmonizing the ancient astrological altar and aligning prismatic mirrors. Within these stone halls, the architects left their final testament: 'The lantern holds the final spark of the devouring sun. Beware the traveler who carries it into the Heart.'`,
    reflection: `The celestial gate rumbles open, but Elian's hands shake. The truth is laid bare in the stone tablets. The lantern in Elian’s hands does not protect the world from the dark—it carries the dormant apocalyptic ember of the very star that almost burned the cosmos to ash. Every second it burns, it eats away at the living seal.`,
    primaryObjective: "Harmonize the Rune Altar, align the Prismatic Mirrors, and unseal the Gate.",
    parTime: 95,
    totalLore: 2,
    drainRate: 1.0,
    nextLevelId: 'heart_of_darkness'
  },
  {
    level: 5,
    id: 'heart_of_darkness',
    title: 'LEVEL 5: THE HEART OF DARKNESS',
    subtitle: 'The Loom of Night',
    mapId: 'heart_of_darkness',
    quote: `"When the final light meets the eternal shade, the world will remember who we were."`,
    introStory: `Elian stepped onto the crystalline void. Titanic hollow roots converged upon a pulsing violet core—the Dark Heart of the world. The Hollow stalked silently among the pillars, a towering silhouette of sorrow. Before the Great Core, a voice echoed in Elian's mind, ancient and tender: 'You have brought the fire to our doorstep, traveler. Will you burn our shelter, or will you understand our love?'`,
    reflection: `At the epicenter of existence, all fear dissolves. The fate of the world rests not in conquering the shadows, but in choosing what harmony means. Light and dark were never meant to be enemies; one is the warmth that awakens, the other is the peace that sustains.`,
    primaryObjective: "Approach the Dark Core Entity and make the climactic choice of the World.",
    parTime: 120,
    totalLore: 2,
    drainRate: 2.0,
    nextLevelId: null
  }
];

class LevelManager {
  constructor() {
    this.levels = LEVELS_CONFIG;
    this.currentLevelIndex = 0;
    this.unlockedLevels = new Set([1]); // Level 1 unlocked by default
    this.levelStats = {}; // { 1: { bestTime, bestScore, stars, completed } }
    this.levelStartTime = 0;

    this.loadProgression();
  }

  loadProgression() {
    try {
      const saved = localStorage.getItem('LAST_LIGHT_LEVEL_PROGRESS');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.unlocked) this.unlockedLevels = new Set(data.unlocked);
        if (data.stats) this.levelStats = data.stats;
      }
    } catch (e) {
      console.warn("Could not load level progression:", e);
    }
  }

  saveProgression() {
    try {
      const data = {
        unlocked: Array.from(this.unlockedLevels),
        stats: this.levelStats
      };
      localStorage.setItem('LAST_LIGHT_LEVEL_PROGRESS', JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save level progression:", e);
    }
  }

  getCurrentLevel() {
    return this.levels[this.currentLevelIndex] || this.levels[0];
  }

  getLevelById(levelId) {
    return this.levels.find(l => l.id === levelId || l.mapId === levelId) || this.levels[0];
  }

  setCurrentLevelByMapId(mapId) {
    const idx = this.levels.findIndex(l => l.mapId === mapId);
    if (idx !== -1) {
      this.currentLevelIndex = idx;
      this.unlockedLevels.add(idx + 1);
      this.levelStartTime = performance.now();
      this.saveProgression();
    }
  }

  calculateStars(level, timeElapsed, remainingFuel) {
    let stars = 1; // Completed
    if (timeElapsed <= level.parTime * 1.5 && remainingFuel > 30) stars = 2;
    if (timeElapsed <= level.parTime && remainingFuel > 50) stars = 3;
    return stars;
  }

  recordLevelCompletion(levelId, timeElapsed, fuelRemaining, scoreEarned) {
    const level = this.getLevelById(levelId);
    const stars = this.calculateStars(level, timeElapsed, fuelRemaining);

    const prev = this.levelStats[level.level] || { bestTime: 9999, bestScore: 0, stars: 0 };
    this.levelStats[level.level] = {
      completed: true,
      bestTime: Math.min(prev.bestTime, Math.round(timeElapsed)),
      bestScore: Math.max(prev.bestScore, scoreEarned),
      stars: Math.max(prev.stars, stars)
    };

    // Unlock next level
    if (level.level < this.levels.length) {
      this.unlockedLevels.add(level.level + 1);
    }

    this.saveProgression();
    return { level, stars, timeElapsed: Math.round(timeElapsed) };
  }
}

window.LastLight.LevelManager = new LevelManager();
window.LastLight.LevelsConfig = LEVELS_CONFIG;
