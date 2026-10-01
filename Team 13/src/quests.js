/**
 * LAST LIGHT - Open World Quest & Objective Tracker Engine
 * Non-linear narrative tracker for the Three Celestial Embers,
 * environmental discoveries, and HUD toast notifications.
 */

window.LastLight = window.LastLight || {};

class QuestEngine {
  constructor() {
    this.mainQuest = "Unseal the Celestial Gate & Unravel the Shroud of Night";
    this.currentObjective = "Speak with Old Wanderer Kaelen at the Crossroads Campfire.";
    
    // The Three Celestial Embers scattered in the surrounding open realms
    this.embers = {
      echo_ember: {
        id: 'echo_ember',
        name: 'Echo Ember',
        realm: 'Whispering Woods (East)',
        collected: false,
        icon: '🌌',
        hint: 'Guarded by weeping spirits in the deep eastern thicket'
      },
      mire_ember: {
        id: 'mire_ember',
        name: 'Mire Ember',
        realm: 'The Black Marsh (South)',
        collected: false,
        icon: '🌊',
        hint: 'Resting upon the Ancient Light Keeper Shrine across the river'
      },
      solar_ember: {
        id: 'solar_ember',
        name: 'Solar Ember',
        realm: 'The Forgotten Ruins (North)',
        collected: false,
        icon: '☀️',
        hint: 'Sealed within the vaulted chambers of the northern stone temple'
      }
    };

    this.optionalObjectives = [
      { id: 'opt_planks', text: "Scavenge sturdy planks to bridge the marsh river chasm", completed: false },
      { id: 'opt_altar', text: "Decode the celestial poem and align the ancient rune altar", completed: false },
      { id: 'opt_mirrors', text: "Orient the prismatic mirrors in the ruins to focus the beam", completed: false },
      { id: 'opt_secrets', text: "Collect all 8 hidden lore fragments throughout the realms", completed: false }
    ];

    this.gateUnlocked = false;
    this.notification = null;
    this.notificationTimer = 0;
  }

  collectEmber(emberId) {
    if (this.embers[emberId] && !this.embers[emberId].collected) {
      this.embers[emberId].collected = true;
      const ember = this.embers[emberId];
      const count = this.getEmberCount();
      
      this.showNotification(`✦ CELESTIAL EMBER CLAIMED: ${ember.name} (${count}/3) ✦`);
      
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playLoreDiscovery();
      }
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(500);
      }

      if (count === 3) {
        this.setObjective("All 3 Celestial Embers gathered! Travel North to The Forgotten Ruins to unseal the Celestial Gate.");
      } else {
        this.setObjective(`Celestial Embers: ${count}/3 gathered. Seek remaining embers in East Woods, South Marsh, or North Ruins.`);
      }

      this.renderHUD();
      return true;
    }
    return false;
  }

  getEmberCount() {
    return Object.values(this.embers).filter(e => e.collected).length;
  }

  hasAllEmbers() {
    return this.getEmberCount() === 3;
  }

  setObjective(newObjective) {
    this.currentObjective = newObjective;
    this.showNotification(`OBJECTIVE: ${newObjective}`);
    this.renderHUD();
  }

  completeOptional(optId) {
    const opt = this.optionalObjectives.find(o => o.id === optId);
    if (opt && !opt.completed) {
      opt.completed = true;
      this.showNotification(`DISCOVERY COMPLETE: ${opt.text}`);
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.FIND_SECRET);
      }
    }
  }

  showNotification(text) {
    this.notification = text;
    this.notificationTimer = 4.0;
    const banner = document.getElementById('quest-toast');
    if (banner) {
      banner.innerText = text;
      banner.classList.add('visible');
    }
  }

  update(dt) {
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) {
        this.notification = null;
        const banner = document.getElementById('quest-toast');
        if (banner) banner.classList.remove('visible');
      }
    }
  }

  renderHUD() {
    const objEl = document.getElementById('hud-objective-text');
    if (objEl) {
      const count = this.getEmberCount();
      objEl.innerHTML = `<span style="color: #f1c40f;">[Embers: ${count}/3]</span> ${this.currentObjective}`;
    }
  }

  renderQuestLog() {
    const container = document.getElementById('quest-log-content');
    if (!container) return;

    const count = this.getEmberCount();

    container.innerHTML = `
      <div class="quest-log-block">
        <h3 class="quest-chapter-title">OPEN WORLD EXPEDITION: THE THREE EMBERS</h3>
        <div class="quest-item main-quest">
          <strong>EXPEDITION GOAL:</strong> ${this.mainQuest}
        </div>
        <div class="quest-item current-step">
          <strong>ACTIVE STEP:</strong> ${this.currentObjective}
        </div>
        
        <h4 class="quest-section-header">The Three Celestial Embers (${count}/3)</h4>
        <div class="embers-checklist" style="display: grid; gap: 8px; margin: 10px 0;">
          ${Object.values(this.embers).map(e => `
            <div class="opt-quest-entry ${e.collected ? 'completed' : ''}" style="background: rgba(18, 28, 42, 0.6); padding: 8px 12px; border-radius: 6px; border: 1px solid ${e.collected ? '#2ecc71' : '#3a4454'};">
              <span class="opt-check" style="font-size: 16px; margin-right: 8px;">${e.collected ? '✅' : '🔒'}</span>
              <span style="font-weight: bold; color: ${e.collected ? '#2ecc71' : '#cbd5e1'};">${e.icon} ${e.name}</span>
              <span style="font-size: 11px; color: #94a3b8; display: block; margin-left: 28px;">${e.realm} &bull; ${e.hint}</span>
            </div>
          `).join('')}
        </div>

        <h4 class="quest-section-header">Exploration & Mysteries</h4>
        <div class="optional-list">
          ${this.optionalObjectives.map(o => `
            <div class="opt-quest-entry ${o.completed ? 'completed' : ''}">
              <span class="opt-check">${o.completed ? '☑' : '☐'}</span>
              <span class="opt-text">${o.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

window.LastLight.Quests = new QuestEngine();
