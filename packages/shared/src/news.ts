/** Locality needs place-name evidence; generic words such as airport or city hall
 * must never pin national/international news to NST. */
export function isNstNewsText(text: string): boolean {
  return /นครศรีธรรมราช|นครศรีฯ|นครฯ|nakhon\s*si\s*thammarat|ปากพนัง|pak\s*phanang|ทุ่งสง|thung\s*song|ลานสกา|lan\s*saka|คีรีวง|khiri\s*wong|ท่าศาลา|tha\s*sala|สิชล|sichon|ขนอม|khanom|ร่อนพิบูลย์|ชะอวด|cha[-\s]*uat|หัวไทร|hua\s*sai|คลองท่าดี|tha\s*dee/i.test(text);
}

/**
 * The language of a headline, by script. The mayor reads Thai, so a story
 * filed in any other language has to be translated before it can be a
 * headline on his desk — and the desk has to know which ones those are.
 */
export type NewsLanguage = "th" | "en" | "zh" | "other";

export function detectNewsLanguage(text: string): NewsLanguage {
  if (/[฀-๿]/.test(text)) return "th";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[a-zA-Z]/.test(text)) return "en";
  return "other";
}
