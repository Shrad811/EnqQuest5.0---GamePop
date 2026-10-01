/**
 * LAST LIGHT - Meaningful Story Dialogues & Script
 * Deep, emotionally resonant narrative detailing Elian's journey,
 * Kaelen's burden, and the cosmic truth of the protective night.
 */

window.LastLight = window.LastLight || {};

window.LastLight.Dialogues = {
  // Tutorial Dialogue: Old Wanderer Kaelen at starting campfire
  'intro_traveler': {
    steps: [
      {
        speaker: 'Old Wanderer Kaelen',
        portraitKey: 'portrait_traveler',
        text: "Elian... you're breathing. Thank the quiet stars. I thought the grey ash of Oakhaven had claimed you as well."
      },
      {
        speaker: 'Elian',
        portraitKey: 'portrait_player',
        text: "The village is silent, Kaelen. The sun refused to rise today. Everyone ran into the forest, screaming that the dark was hunting them."
      },
      {
        speaker: 'Old Wanderer Kaelen',
        portraitKey: 'portrait_traveler',
        text: "Men always run from what they do not understand, burning everything in their wake. Take this ancient lantern. Its brass chamber holds exactly 120 seconds of flame. Rest at this campfire whenever you must; here, the light will not die."
      },
      {
        speaker: 'Elian',
        portraitKey: 'portrait_player',
        text: "Where must I go? The paths stretch in every direction."
      },
      {
        speaker: 'Old Wanderer Kaelen',
        portraitKey: 'portrait_traveler',
        text: "You stand at the Crossroads. To the East lies the Whispering Woods, home to the Echo Ember. To the South, the Black Marsh holds the Mire Ember. To the North, the Forgotten Ruins enshrine the Solar Ember and the sealed Celestial Gate. Explore freely. When you hold all Three Celestial Embers, the gate to the Heart shall open."
      }
    ]
  },

  // Repeated conversation with Kaelen
  'traveler_advice': {
    steps: [
      {
        speaker: 'Old Wanderer Kaelen',
        portraitKey: 'portrait_traveler',
        text: "The forest is open to you, Elian. Head East to Whispering Woods, South to Black Marsh, or North to the Ruins. If your flame runs low, return here to rest by the hearth."
      }
    ]
  },

  // Stele of the Light Keeper (Black Marsh Shrine)
  'stele_keeper_communion': {
    steps: [
      {
        speaker: 'Ancient Light Keeper',
        portraitKey: 'portrait_traveler',
        text: "Traveler of the spark... you stand upon the Sunken Sanctuary. In our epoch, the heavens burned without dusk. The rivers boiled, and mothers could not put their feverish young to sleep."
      },
      {
        speaker: 'Elian',
        portraitKey: 'portrait_player',
        text: "The legends told us darkness was a curse that swallowed civilization..."
      },
      {
        speaker: 'Ancient Light Keeper',
        portraitKey: 'portrait_traveler',
        text: "No, child. Darkness was the medicine. We spun the great shroud of night so the weary earth could finally rest and cool. We gave our physical forms to make stars possible. Do not let humanity burn our gift in blind panic."
      }
    ]
  },

  // Climactic Final Encounter: The Voice of the Darkness Core (Nyra)
  'final_entity_choice': {
    steps: [
      {
        speaker: 'Nyra, Weaver of the Shroud',
        portraitKey: 'portrait_entity',
        text: "You stand before the Heart at last, bearer of the flame. Look upon my roots... and look upon the fire burning in your hands."
      },
      {
        speaker: 'Elian',
        portraitKey: 'portrait_player',
        text: "The creatures tried to stop me at every turn. Was it all to protect this core?"
      },
      {
        speaker: 'Nyra, Weaver of the Shroud',
        portraitKey: 'portrait_entity',
        text: "They were not hunting you, Elian. They were guardians, weeping as they tried to snuff your ember before it scorched our veil. In your lantern burns the last dormant spark of the Devouring Sun—the star that once nearly vaporized every drop of life on earth."
      },
      {
        speaker: 'Elian',
        portraitKey: 'portrait_player',
        text: "We spent generations terrified of the shadows... when all along, the darkness was holding back the fire that would destroy us."
      },
      {
        speaker: 'Nyra, Weaver of the Shroud',
        portraitKey: 'portrait_entity',
        text: "The last second ticks, traveler of Oakhaven. The cosmos watches your hands. Will you let fear destroy the veil, surrender the spark to eternal rest, or become the bridge between night and day?"
      },
      {
        speaker: 'The Final Decree',
        portraitKey: 'portrait_player',
        text: "Choose the destiny of the world:",
        choices: [
          {
            text: "🔥 Shatter the Core with the Lantern (Unleash the Devouring Sun)",
            action: () => {
              window.LastLight.Game.triggerEnding('DESTROY');
            }
          },
          {
            text: "🌑 Extinguish the Lantern Forever (Embrace the Peaceful Sanctuary of Night)",
            action: () => {
              window.LastLight.Game.triggerEnding('EXTINGUISH');
            }
          },
          {
            text: "✨ Merge Flame & Shadow (Ascend as the Eternal Light Keeper)",
            action: () => {
              window.LastLight.Game.triggerEnding('KEEPER');
            }
          }
        ]
      }
    ]
  }
};
