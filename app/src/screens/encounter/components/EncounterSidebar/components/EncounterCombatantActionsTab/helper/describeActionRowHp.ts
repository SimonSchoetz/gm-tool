export const describeActionRowHp = (hp: { text: string } | null): string =>
  hp ? hp.text : 'HP is not set. Set max HP to track it.';
