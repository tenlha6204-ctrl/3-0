/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GuitarString {
  id: number;
  openNote: string;
  name: string;
  gauge: number; // For visual thickness
}

export const GUITAR_STRINGS: GuitarString[] = [
  { id: 0, name: 'e', openNote: 'E4', gauge: 1 },
  { id: 1, name: 'B', openNote: 'B3', gauge: 1.5 },
  { id: 2, name: 'G', openNote: 'G3', gauge: 2 },
  { id: 3, name: 'D', openNote: 'D3', gauge: 2.5 },
  { id: 4, name: 'A', openNote: 'A2', gauge: 3.5 },
  { id: 5, name: 'E', openNote: 'E2', gauge: 4.5 },
];

export const FRETS_COUNT = 15;
