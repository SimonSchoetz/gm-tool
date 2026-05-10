import type { LazyDmStepKey } from '@db/session-step';

type LazyDmStepDefinition = {
  key: LazyDmStepKey;
  name: string;
  tooltip: string;
  placeholder: string;
};

export const LAZY_DM_STEPS: LazyDmStepDefinition[] = [
  {
    key: 'review_characters',
    name: 'Player Characters',
    tooltip:
      'Before we do anything else, it helps to spend a few minutes reviewing the player characters. What are their names? What do they want? What plays into their backgrounds? What do the players of these characters enjoy at the table? You might not even write anything down during this step, but reviewing the characters helps wire them into your mind—and ensures that the rest of your preparation fits around them.',
    placeholder:
      "Which players are attending and what's in their stall for their characters during this session?",
  },
  {
    key: 'strong_start',
    name: 'Strong Start',
    tooltip:
      "How a game starts is likely the most important piece of preparation we can do. Setting the stage for the session determines a great deal about how the rest of the game will go. When you define where a game session starts, you figure out what's going on, what the initial focus of the session is, and how you can get close to the action. When in doubt, start with a fight.",
    placeholder: 'How will the players be drawn into the world?',
  },
  {
    key: 'potential_scenes',
    name: 'Potential Scenes',
    tooltip:
      "With a strong start in hand, we can then outline a short list of potential scenes that might unfold. This step exists mostly to make you feel as though you have a handle on the game before you start. However, as GMs, all of us must always be ready to throw our potential scenes away when the game goes in a different direction—as it often does. Usually, it's enough to come up with only a few words per scene, and to expect one or two scenes per hour of play.",
    placeholder: 'How could the sessuon potentially fan out?',
  },
  {
    key: 'secrets_clues',
    name: 'Secrets & Clues',
    tooltip:
      'The next step is second only in importance to the strong start, and is one of the most powerful tools available to the Lazy Dungeon Master. Secrets and clues are single short sentences that describe a clue, a piece of the story, or a piece of the world that the characters can discover during the game. Keep these secrets and clues abstract from their place of discovery so that you can drop them into the game wherever it makes sense.',
    placeholder: 'What will the players discover and learn about the world?',
  },
  {
    key: 'fantastic_locations',
    name: 'Fantastic Locations',
    tooltip:
      "Building evocative locations isn't easily improvised. As such, it's worth spending time writing out a handful of fantastic locations that the characters might discover and explore during the game. Each location can be thought of as a set, a room, or a backdrop for a single scene in your adventure. Describe each location with a short evocative title, then write down three fantastic aspects for it.",
    placeholder:
      'Which fantastical points of interest will the player discover?',
  },
  {
    key: 'important_npcs',
    name: 'Important NPCs',
    tooltip:
      "During our preparation, we'll outline those NPCs (nonplayer characters) most critical to the adventure, focusing on a name and a connection to the adventure, then wrapping the NPC in a character archetype from popular fiction. Many other NPCs—maybe even most of them—can be improvised right at the table.",
    placeholder: 'Which NPCs will the players encounter and interact with?',
  },
  {
    key: 'relevant_monsters',
    name: 'Monsters',
    tooltip:
      'What monsters are the characters most likely to face? What monsters make sense for a specific location and situation? Reading through books of monsters can give you the fuel to choose the right creatures for the right situation. Understanding the loose relationship between monster challenge rating and character level can help you understand how a battle might go.',
    placeholder: 'Which monsters will the players encounter?',
  },
  {
    key: 'magic_items',
    name: 'Loot & Rewards',
    tooltip:
      "Players love magic items, and it's worthwhile to spend time preparing items they'll find interesting. This step also helps to directly impact the characters—by dropping an interesting part of the story literally into their hands. You can use a mixture of techniques to reward magic items, from selecting items randomly to selecting specific items based on the themes of the characters.",
    placeholder: 'What potential rewards await the players?',
  },
];
