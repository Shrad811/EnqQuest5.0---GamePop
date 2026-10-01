/**
 * LAST LIGHT - Inventory System
 * Manages usable items, keys, relics, and grid UI rendering.
 */

window.LastLight = window.LastLight || {};

class InventorySystem {
  constructor() {
    this.items = []; // Array of { id, name, type, icon, count, description, usable }
  }

  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing && existing.type !== 'KEY' && existing.type !== 'QUEST') {
      existing.count += (item.count || 1);
    } else {
      this.items.push({
        id: item.id,
        name: item.name,
        type: item.type || 'MISC',
        icon: item.icon || '📦',
        count: item.count || 1,
        description: item.description || '',
        usable: item.usable || false
      });
    }

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playFuelPickup();
    }
  }

  removeItem(itemId, count = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    if (this.items[idx].count > count) {
      this.items[idx].count -= count;
    } else {
      this.items.splice(idx, 1);
    }
    return true;
  }

  hasItem(itemId) {
    return this.items.some(i => i.id === itemId);
  }

  useItem(itemId, player) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || !item.usable) return false;

    if (item.id === 'herb') {
      if (player.health < window.LastLight.Constants.MAX_HEALTH) {
        player.heal(1);
        this.removeItem(itemId, 1);
        this.renderUI();
        return true;
      }
    } else if (item.id === 'fuel_flask') {
      player.addFuel(25);
      this.removeItem(itemId, 1);
      this.renderUI();
      return true;
    }
    return false;
  }

  renderUI() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `<div class="empty-inventory">Your satchel is empty. Explore the forest to scavenge resources.</div>`;
      return;
    }

    container.innerHTML = this.items.map(item => `
      <div class="inventory-card">
        <div class="item-header">
          <span class="item-icon">${item.icon}</span>
          <span class="item-name">${item.name}</span>
          ${item.count > 1 ? `<span class="item-count">x${item.count}</span>` : ''}
        </div>
        <p class="item-desc">${item.description}</p>
        ${item.usable ? `
          <button class="btn btn-secondary btn-sm" onclick="window.LastLight.Inventory.useItem('${item.id}', window.LastLight.Game.player)">
            Use
          </button>
        ` : ''}
      </div>
    `).join('');
  }
}

window.LastLight.Inventory = new InventorySystem();
