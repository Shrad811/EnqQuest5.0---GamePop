/**
 * LAST LIGHT - Persistent Save System
 * Saves and restores state to/from browser localStorage.
 */

window.LastLight = window.LastLight || {};

const SAVE_KEY = 'LAST_LIGHT_SAVE_SLOT_1';

class SaveSystem {
  save(gameState) {
    try {
      const data = {
        timestamp: Date.now(),
        mapId: gameState.currentMapId,
        player: {
          x: gameState.player.x,
          y: gameState.player.y,
          health: gameState.player.health,
          fuel: gameState.player.fuel,
          direction: gameState.player.direction
        },
        inventory: gameState.inventory.items,
        journal: Array.from(gameState.journal.discoveredLore),
        quests: {
          currentObjective: gameState.quests.currentObjective,
          embers: gameState.quests.embers,
          optional: gameState.quests.optionalObjectives
        },
        scoring: {
          score: gameState.scoring.score,
          timeSurvived: gameState.scoring.timeSurvived,
          areasExplored: Array.from(gameState.scoring.areasExplored)
        },
        levels: {
          unlocked: window.LastLight.LevelManager ? Array.from(window.LastLight.LevelManager.unlockedLevels) : [1],
          stats: window.LastLight.LevelManager ? window.LastLight.LevelManager.levelStats : {}
        }
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save game:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load game:', e);
      return null;
    }
  }

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }
}

window.LastLight.Save = new SaveSystem();
