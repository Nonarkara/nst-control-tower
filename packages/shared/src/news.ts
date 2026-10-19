/** Locality needs place-name evidence; generic words such as airport or city hall
 * must never pin national/international news to NST. */
export function isNstNewsText(text: string): boolean {
  return /นครศรีธรรมราช|นครศรีฯ|นครฯ|nakhon\s*si\s*thammarat|ปากพนัง|pak\s*phanang|ทุ่งสง|thung\s*song|ลานสกา|lan\s*saka|คีรีวง|khiri\s*wong|ท่าศาลา|tha\s*sala|สิชล|sichon|ขนอม|khanom|ร่อนพิบูลย์|ชะอวด|cha[-\s]*uat|หัวไทร|hua\s*sai|คลองท่าดี|tha\s*dee/i.test(text);
}
