/**
 * LAST LIGHT - Journal & Story Collectibles System
 * Organizes discovered lore entries into 4 categories:
 * - Memories
 * - Letters
 * - Ancient Records
 * - Discoveries
 */

window.LastLight = window.LastLight || {};

const STORY_LORE_DATABASE = {
  // --- LETTERS ---
  'letter_fleeing': {
    id: 'letter_fleeing',
    category: 'Letters',
    title: 'Hastily Scrawled Note',
    author: 'Village Elder',
    icon: '✉️',
    text: `"Pack only what you can carry. The sky has blackened over the ridge. It's not a storm. It does not move with the wind. The forest is breathing inward. May the gods forgive us for what we unearthed in the quarry."`
  },
  'letter_alchemist': {
    id: 'letter_alchemist',
    category: 'Letters',
    title: 'Alchemist’s Research Log',
    author: 'Scholar Valen',
    icon: '📜',
    text: `"The lantern oils are failing faster near the marsh. At first, I cursed the damp air. But yesterday, I held my torch toward a shadow beast—it did not shriek in fury. It wept. Why do they guard the deeper groves with such despair?"`
  },
  
  // --- MEMORIES ---
  'memory_lantern_gift': {
    id: 'memory_lantern_gift',
    category: 'Memories',
    title: 'The Old Traveler’s Warning',
    author: 'Kaelen the Wanderer',
    icon: '🕯️',
    text: `"He placed the brass lantern into my palms. His fingers trembled, scarred by white-hot burns. 'Keep the flame alive, Elian,' he whispered. 'Whatever you hear in the darkness, don't follow it. For once you look upon its face, you may never wish to return.'"`
  },
  'memory_voices_marsh': {
    id: 'memory_voices_marsh',
    category: 'Memories',
    title: 'Echoes in the Mist',
    author: 'Elian’s Journal',
    icon: '🌫️',
    text: `"The Whispers aren't hunting for flesh. When they brush against my mantle, they speak in the voices of the missing children of Oakhaven: 'Turn back, Elian... the fire burns too bright... do not awaken the sun that scorched the sky.'"`
  },

  // --- ANCIENT RECORDS ---
  'record_light_keeper': {
    id: 'record_light_keeper',
    category: 'Ancient Records',
    title: 'Stele of the Light Keeper',
    author: 'First Dynasty Inscription',
    icon: '🗿',
    text: `"In the age before the shadow, the Great Sun rained fire without dusk. The rivers boiled, and the earth cracked with weeping. Then rose the Light Keeper, who spun the Sacred Veil of Night to shield all mortal life beneath cool, merciful stars."`
  },
  'record_celestial_containment': {
    id: 'record_celestial_containment',
    category: 'Ancient Records',
    title: 'Tablet of the Great Ward',
    author: 'Ancient Architects',
    icon: '🏛️',
    text: `"The darkness was not born of malice. It is a lock. A living obsidian shroud woven to contain the Devouring Sun. The lantern you carry holds the final ember of that cataclysmic star. Touch it not to the Heart, lest the world burn anew."`
  },

  // --- DISCOVERIES ---
  'discovery_altar_poem': {
    id: 'discovery_altar_poem',
    category: 'Discoveries',
    title: 'Rune Inscription of the Eclipse',
    author: 'Temple Scribe',
    icon: '✨',
    text: `"To unseal the Sanctum: Align the celestial rings in the true sequence of the Great Shroud: First the Sun rises, then the Eclipse casts its veil, and finally the Void holds eternal peace."`
  },
  'discovery_dark_core': {
    id: 'discovery_dark_core',
    category: 'Discoveries',
    title: 'The Truth of the Core',
    author: 'Final Revelation',
    icon: '🔮',
    text: `"The entity within the ancient tree is not a monster. It is the sleeping warden, weeping as my lantern scorches its protective roots. The creatures were not trying to murder me—they were trying to put out the fire before it woke the burning cataclysm."`
  }
};

class JournalSystem {
  constructor() {
    this.discoveredLore = new Set();
    this.currentCategory = 'Letters';
  }

  unlock(loreId) {
    if (STORY_LORE_DATABASE[loreId] && !this.discoveredLore.has(loreId)) {
      this.discoveredLore.add(loreId);
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playLoreDiscovery();
      }
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.DISCOVER_CLUE);
      }
      return true;
    }
    return false;
  }

  has(loreId) {
    return this.discoveredLore.has(loreId);
  }

  getCount() {
    return this.discoveredLore.size;
  }

  setCategory(cat) {
    this.currentCategory = cat;
    this.renderUI();
  }

  renderUI() {
    const categories = ['World Map', 'Letters', 'Memories', 'Ancient Records', 'Discoveries'];
    const navContainer = document.getElementById('journal-tabs');
    const contentContainer = document.getElementById('journal-entries');
    if (!navContainer || !contentContainer) return;

    // Render tab buttons
    navContainer.innerHTML = categories.map(cat => `
      <button class="journal-tab-btn ${this.currentCategory === cat ? 'active' : ''}" 
              onclick="window.LastLight.Journal.setCategory('${cat}')">
        ${cat === 'World Map' ? '🗺️ World Map' : cat}
      </button>
    `).join('');

    if (this.currentCategory === 'World Map') {
      this.renderWorldMap(contentContainer);
      return;
    }

    // Filter discovered entries by category
    const entries = Array.from(this.discoveredLore)
      .map(id => STORY_LORE_DATABASE[id])
      .filter(item => item && item.category === this.currentCategory);

    if (entries.length === 0) {
      contentContainer.innerHTML = `
        <div class="empty-journal">
          No records discovered in this category yet. Look for glowing obelisks, lost satchels, and abandoned camps in the gloom.
        </div>
      `;
      return;
    }

    contentContainer.innerHTML = entries.map(item => `
      <div class="journal-entry-card">
        <div class="entry-header">
          <span class="entry-icon">${item.icon}</span>
          <span class="entry-title">${item.title}</span>
          <span class="entry-author">— ${item.author}</span>
        </div>
        <div class="entry-body">${item.text}</div>
      </div>
    `).join('');
  }

  renderWorldMap(container) {
    const currentMapId = (window.LastLight.Game && window.LastLight.Game.mapManager && window.LastLight.Game.mapManager.currentMap)
      ? window.LastLight.Game.mapManager.currentMap.id
      : 'forest_edge';

    const embers = window.LastLight.Quests ? window.LastLight.Quests.embers : {};
    const emberCount = window.LastLight.Quests ? window.LastLight.Quests.getEmberCount() : 0;

    container.innerHTML = `
      <div class="world-map-wrapper">
        <div class="world-map-header">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 style="margin: 0; color: #f1c40f; font-size: 18px; letter-spacing: 1px;">🗺️ OPEN WORLD CARTOGRAPHY</h3>
              <p class="world-map-sub" style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">Non-linear realm map &bull; Explore in any direction around the central crossroads</p>
            </div>
            <div class="embers-summary-badge" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #c29759; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #f1c40f;">
              ✨ CELESTIAL EMBERS: <strong>${emberCount} / 3</strong>
            </div>
          </div>
        </div>

        <!-- Spatial 2D Crossroads Layout -->
        <div class="spatial-world-layout">
          
          <!-- TOP: Heart of Darkness (Final Sanctum) -->
          <div class="spatial-row center-row">
            <div class="spatial-node sanctum-node ${currentMapId === 'heart_of_darkness' ? 'active-node' : ''}">
              <div class="node-tag">FINAL SANCTUM</div>
              <div class="node-title">🔮 The Heart of Darkness</div>
              <div class="node-details">Void Abyss &bull; 2.0x Drain &bull; Core of Nyra</div>
              <div class="node-status">${emberCount === 3 ? '🔓 Gate Accessible' : '🔒 Sealed by Celestial Gate'}</div>
              ${currentMapId === 'heart_of_darkness' ? '<div class="node-player-pin">📍 YOU ARE HERE</div>' : ''}
            </div>
          </div>

          <div class="spatial-connector vertical-line">
            <span class="path-label">▲ NORTH PATHWAY (Requires 3 Embers) ▼</span>
          </div>

          <!-- UPPER CENTER: The Forgotten Ruins (North Realm) -->
          <div class="spatial-row center-row">
            <div class="spatial-node ruins-node ${currentMapId === 'forgotten_ruins' ? 'active-node' : ''}">
              <div class="node-direction">NORTH REALM</div>
              <div class="node-title">🏛️ The Forgotten Ruins</div>
              <div class="node-details">Stone Halls &bull; 1.0x Drain &bull; Celestial Gate</div>
              <div class="node-ember-tag ${embers.solar_ember && embers.solar_ember.collected ? 'collected' : ''}">
                ${embers.solar_ember && embers.solar_ember.collected ? '✅ Solar Ember Claimed' : '☀️ Solar Ember [Vault Chambers]'}
              </div>
              ${currentMapId === 'forgotten_ruins' ? '<div class="node-player-pin">📍 YOU ARE HERE</div>' : ''}
            </div>
          </div>

          <div class="spatial-connector vertical-line">
            <span class="path-label">▲ NORTH PATHWAY ▼</span>
          </div>

          <!-- CENTER ROW: Ashen Glade (West) ── Crossroads (Center Hub) ── Whispering Woods (East) -->
          <div class="spatial-row horizontal-row">
            
            <!-- WEST: Ashen Glade -->
            <div class="spatial-node west-node">
              <div class="node-direction">WEST CLEARING</div>
              <div class="node-title">🌲 Ashen Glade</div>
              <div class="node-details">Sacred Fuel Cache &bull; Old Records</div>
              <div class="node-status" style="color: #4ade80;">Safe Expedition Path</div>
            </div>

            <div class="spatial-connector horizontal-line">
              <span class="path-label">◄ WEST | EAST ►</span>
            </div>

            <!-- CENTER HUB: The Forest Crossroads -->
            <div class="spatial-node hub-node ${currentMapId === 'forest_edge' ? 'active-node' : ''}">
              <div class="node-hub-badge">CENTRAL HUB & SANCTUARY</div>
              <div class="node-title">🔥 The Forest Crossroads</div>
              <div class="old-man-poi">
                <span style="font-size: 16px;">👴</span>
                <strong>Old Wanderer Kaelen's Campfire</strong>
              </div>
              <div class="node-details">Safe Zone &bull; 0.0x Drain &bull; Slow Healing</div>
              <div class="node-status" style="color: #f1c40f;">All 4 paths connect here. Return anytime!</div>
              ${currentMapId === 'forest_edge' ? '<div class="node-player-pin">📍 YOU ARE HERE</div>' : ''}
            </div>

            <div class="spatial-connector horizontal-line">
              <span class="path-label">◄ WEST | EAST ►</span>
            </div>

            <!-- EAST: Whispering Woods -->
            <div class="spatial-node woods-node ${currentMapId === 'whispering_woods' ? 'active-node' : ''}">
              <div class="node-direction">EAST REALM</div>
              <div class="node-title">🌫️ Whispering Woods</div>
              <div class="node-details">Weeping Canopy &bull; 1.25x Drain &bull; Mere</div>
              <div class="node-ember-tag ${embers.echo_ember && embers.echo_ember.collected ? 'collected' : ''}">
                ${embers.echo_ember && embers.echo_ember.collected ? '✅ Echo Ember Claimed' : '🌌 Echo Ember [Secret Grove]'}
              </div>
              ${currentMapId === 'whispering_woods' ? '<div class="node-player-pin">📍 YOU ARE HERE</div>' : ''}
            </div>
          </div>

          <div class="spatial-connector vertical-line">
            <span class="path-label">▲ SOUTH PATHWAY ▼</span>
          </div>

          <!-- BOTTOM: The Black Marsh (South Realm) -->
          <div class="spatial-row center-row">
            <div class="spatial-node marsh-node ${currentMapId === 'black_marsh' ? 'active-node' : ''}">
              <div class="node-direction">SOUTH REALM</div>
              <div class="node-title">🪵 The Black Marsh</div>
              <div class="node-details">Cursed Mire &bull; 1.5x Drain &bull; Sunken Sanctuary</div>
              <div class="node-ember-tag ${embers.mire_ember && embers.mire_ember.collected ? 'collected' : ''}">
                ${embers.mire_ember && embers.mire_ember.collected ? '✅ Mire Ember Claimed' : '🌊 Mire Ember [Keeper Shrine]'}
              </div>
              ${currentMapId === 'black_marsh' ? '<div class="node-player-pin">📍 YOU ARE HERE</div>' : ''}
            </div>
          </div>

        </div>

        <div class="world-map-footer" style="margin-top: 14px; text-align: center; color: #94a3b8; font-size: 11px;">
          💡 <em>Tip: The Old Wanderer Kaelen remains at the central hearth. Look at the rotating compass on your minimap to orient yourself.</em>
        </div>
      </div>
    `;
  }
}

window.LastLight.Journal = new JournalSystem();
window.LastLight.StoryLoreDB = STORY_LORE_DATABASE;
