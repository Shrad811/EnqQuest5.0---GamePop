/**
 * LAST LIGHT - Scoring & Performance Tracker
 * Calculates points, tracks exploration metrics, and generates end-game ranks.
 */

window.LastLight = window.LastLight || {};

class ScoringSystem {
  constructor() {
    this.score = 0;
    this.timeSurvived = 0;
    this.fuelCollected = 0;
    this.cluesFound = 0;
    this.puzzlesSolved = 0;
    this.creaturesDefeated = 0;
    this.chaptersCompleted = 0;
    this.areasExplored = new Set();
  }

  reset() {
    this.score = 0;
    this.timeSurvived = 0;
    this.fuelCollected = 0;
    this.cluesFound = 0;
    this.puzzlesSolved = 0;
    this.creaturesDefeated = 0;
    this.chaptersCompleted = 0;
    this.areasExplored.clear();
  }

  addPoints(amount) {
    this.score += amount;
    this.renderHUD();
  }

  recordArea(areaId) {
    if (!this.areasExplored.has(areaId)) {
      this.areasExplored.add(areaId);
      this.addPoints(window.LastLight.Constants.POINTS.EXPLORE_AREA);
    }
  }

  discoverArea(areaId) {
    this.recordArea(areaId);
  }

  updateTime(dt) {
    this.timeSurvived += dt;
  }

  calculateFinalScore(remainingFuel) {
    const fuelBonus = Math.floor(Math.max(0, remainingFuel) * window.LastLight.Constants.POINTS.FUEL_MULTIPLIER);
    const total = this.score + fuelBonus;

    let rank = 'C';
    if (total >= 7000) rank = 'S (Ethereal Guardian)';
    else if (total >= 5000) rank = 'A (Master of Light)';
    else if (total >= 3000) rank = 'B (Wanderer of Twilight)';
    else rank = 'C (Survivor of the Gloom)';

    return {
      baseScore: this.score,
      fuelBonus: fuelBonus,
      totalScore: total,
      timeSurvived: Math.floor(this.timeSurvived),
      cluesFound: window.LastLight.Journal ? window.LastLight.Journal.getCount() : 0,
      rank: rank
    };
  }

  renderHUD() {
    const scoreEl = document.getElementById('hud-score-val');
    if (scoreEl) {
      scoreEl.innerText = this.score.toLocaleString();
    }
  }
}

window.LastLight.Scoring = new ScoringSystem();
