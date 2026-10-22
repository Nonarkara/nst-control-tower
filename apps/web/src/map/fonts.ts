/**
 * The map's type — one family, everywhere.
 *
 * The map used to ask for 'Inter', a font this product never shipped, so
 * every layer that named it fell through to IBM Plex Sans Thai's Latin
 * subset while the layers beside them rendered in Libre Franklin. Two
 * typefaces on one map, and both were wrong: the labels were not the house
 * Latin face. These stacks name only fonts that exist here — Libre
 * Franklin for Latin, IBM Plex Sans Thai for Thai (self-hosted through
 * @fontsource), so each glyph is drawn by the family that owns it.
 */
export const MAP_FONT = "'Libre Franklin Variable', 'IBM Plex Sans Thai', system-ui, sans-serif";
