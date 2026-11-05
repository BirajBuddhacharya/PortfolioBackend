import { Profanity } from '@2toad/profanity';

const profanity = new Profanity({ languages: ['en'], wholeWord: false });

// wholeWord: false catches glued forms (niggax, fucker@) but also flags
// short words inside legitimate names, so trim the loosest ones and
// whitelist known false-positive words.
profanity.removeWords(['dick', 'cock', 'pussy', 'hoe', 'penis', 'vagina', 'queef', 'rape', 'tit', 'fart', 'poop', 'rectum', 'pubes', 'tits', 'sexy', 'douche']);
profanity.whitelist.addWords(['raccoon', 'racoon']);

/** Leet-speak substitutions banned senders commonly use to sneak past filters. */
const leetMap: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
};

function normalize(value: string): string {
  // NFKD decomposes accented lookalikes (niggá -> nigg´a), then drop diacritics
  let out = value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  for (const [char, sub] of Object.entries(leetMap)) {
    out = out.split(char).join(sub);
  }
  return out;
}

/**
 * Returns true when the email is clean (no banned words).
 * Profanity list and matching are delegated to @2toad/profanity
 * (wholeWord: false so glued forms like niggax are caught);
 * homoglyph + leet normalization is layered on top here.
 */
export function validateEmail(email: string | undefined | null): boolean {
  if (!email) return true;
  return !profanity.exists(normalize(email));
}
