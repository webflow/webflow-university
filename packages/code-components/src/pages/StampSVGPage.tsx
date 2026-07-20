import { button, folder, useControls } from 'leva';
import { useEffect, useMemo, useRef, useState } from 'react';
import StampSVG, { type StampSVGHandle } from '../components/Stamps/StampSVG';
import {
  STAMP_ASPECT_RATIO_OPTIONS,
  STAMP_FONT_OPTIONS,
} from '../components/Stamps/StampSVG.options';
import { COURSE_STAMPS } from '../components/Stamps/courses';
import './StampSVGPage.css';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 10;
const SAVED_SETUPS_KEY = 'stamp-svg-saved-setups';
const NO_SAVED_SETUP = '(select a setup)';
const MAX_HISTORY = 80;
const HISTORY_DEBOUNCE_MS = 400;

type ViewTransform = {
  x: number;
  y: number;
  scale: number;
};

type SavedSetupsMap = Record<string, Record<string, unknown>>;

const courseOptions = Object.fromEntries(
  COURSE_STAMPS.map((course) => [course.title, course.title])
) as Record<string, string>;

const MAX_STAMP_COUNT = COURSE_STAMPS.length;
const STAMP_ROTATION_OFFSETS = [0, 4, -2, 6, -5, 3, -6, 5, -3, 2];

const aspectRatioOptions = { ...STAMP_ASPECT_RATIO_OPTIONS } as Record<string, string>;
const fontOptions = { ...STAMP_FONT_OPTIONS } as Record<string, string>;

const THEME_STAMP_CONTROLS = {
  dark: {
    outlineColor: '#222222',
    outlineWidth: 6,
    shadowOpacity: 0.55,
    paperTextureOpacity: 0.18,
  },
  light: {
    outlineColor: '#efefef',
    outlineWidth: 3,
    shadowOpacity: 0.32,
    paperTextureOpacity: 0.28,
  },
} as const;

/** Canonical page defaults — keep in sync with Copy JSON / component defaults */
const DEFAULT_PAGE_SETTINGS = {
  lightMode: false,
  stampFrame: true,
  frameDistort: true,
  frameInkDisplacement: 2.2,
  frameInkBlur: 0.45,
  frameInkTurbulence: 0.01,
  frameInkBreaks: 0.35,
  paperTexture: true,
  paperTextureOpacity: 0.18,
  paperTextureScale: 0.9,
  imageDistort: false,
  imageDistortAmount: 13,
  imageDistortTurbulence: 0.015,
  imageDistortOctaves: 2,
  imageDistortBlur: 0.35,
  imageErode: true,
  imageErodeOverText: true,
  imageErodeAmount: 0.012,
  imageErodeScale: 1.8,
  imageErodeOpacity: 0.18,
  imageErodeSoftness: 0.4,
  imageErodeContrast: 0.68,
  imageErodeVariation: 0.6,
  imageErodeVariationScale: 0.32,
  interactiveTilt: true,
  tiltAmount: 6,
  course: 'Webflow for Marketers',
  stampCount: 10,
  dateLabel: '16.07.2026',
  fontFamily: STAMP_FONT_OPTIONS['Instrument Serif'],
  fontWeight: 600,
  letterSpacing: 0,
  titleFontSize: 46,
  titleMaxWidth: 100,
  dateFontSize: 19,
  showLogo: true,
  logoSize: 70,
  textOpacity: 1,
  textGlitch: true,
  textGlitchAmount: 2,
  textGlitchBleed: 0.2,
  textGlitchSlice: 0.14,
  textGlitchErode: 0.1,
  textGlitchErodeOpacity: 0.6,
  aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
  rotation: -3,
  paperBorder: 28,
  perforationCount: 22,
  perforationRadius: 18,
  outlineColor: '#222222',
  outlineWidth: 6,
  edgeRoughness: 16,
  grainFrequency: 0.018,
  grainOctaves: 2,
  seed: 11,
  surfaceBlur: 18,
  surfaceScale: 4,
  specularStrength: 0.08,
  specularExponent: 68,
  highlightOpacity: 0.05,
  lightZ: 1375,
  pointerLight: false,
  showShadow: true,
  shadowOpacity: 0.55,
  shadowBlur: 26,
  shadowX: 8,
  shadowY: 18,
} as const;

function loadSavedSetups(): SavedSetupsMap {
  try {
    const raw = window.localStorage.getItem(SAVED_SETUPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as SavedSetupsMap;
  } catch {
    return {};
  }
}

function persistSavedSetups(setups: SavedSetupsMap) {
  window.localStorage.setItem(SAVED_SETUPS_KEY, JSON.stringify(setups));
}

function setupSelectOptions(setups: SavedSetupsMap): Record<string, string> {
  const names = Object.keys(setups).sort((a, b) => a.localeCompare(b));
  return {
    [NO_SAVED_SETUP]: NO_SAVED_SETUP,
    ...Object.fromEntries(names.map((name) => [name, name])),
  };
}

/** One-click looks — each sets a coherent, intentionally different cluster of controls */
const STAMP_PRESETS = {
  "Keegan's Fave #1": {
    lightMode: true,
    ...THEME_STAMP_CONTROLS.light,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 7.7,
    frameInkBlur: 0.35,
    frameInkTurbulence: 0.012,
    frameInkBreaks: 0.02,
    paperTexture: true,
    paperTextureOpacity: 0.28,
    paperTextureScale: 0.9,
    imageDistort: true,
    imageDistortAmount: 8,
    imageDistortTurbulence: 0.03,
    imageDistortOctaves: 2,
    imageDistortBlur: 0.3,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.01,
    imageErodeScale: 1.6,
    imageErodeOpacity: 0.44,
    imageErodeSoftness: 0.1,
    imageErodeContrast: 0.55,
    imageErodeVariation: 0.4,
    imageErodeVariationScale: 0.3,
    interactiveTilt: true,
    tiltAmount: 6,
    course: 'Webflow for Marketers',
    stampCount: 10,
    dateLabel: '16.07.2026',
    fontFamily: STAMP_FONT_OPTIONS['Instrument Serif'],
    fontWeight: 400,
    letterSpacing: -0.5,
    titleFontSize: 40,
    titleMaxWidth: 44,
    dateFontSize: 27,
    showLogo: true,
    logoSize: 88,
    textOpacity: 1,
    textGlitch: true,
    textGlitchAmount: 1.5,
    textGlitchBleed: 0.25,
    textGlitchSlice: 0.12,
    textGlitchErode: 0.12,
    textGlitchErodeOpacity: 0.55,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
    rotation: -2,
    paperBorder: 28,
    perforationCount: 28,
    perforationRadius: 14,
    edgeRoughness: 6,
    grainFrequency: 0.018,
    grainOctaves: 2,
    seed: 11,
    surfaceBlur: 18,
    surfaceScale: 3.6,
    specularStrength: 0.1,
    specularExponent: 68,
    highlightOpacity: 0.08,
    lightZ: 1375,
    pointerLight: true,
    showShadow: true,
    shadowBlur: 22,
    shadowX: 6,
    shadowY: 14,
  },
  'Studio clean': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: false,
    frameInkDisplacement: 0,
    frameInkBlur: 0,
    frameInkTurbulence: 0,
    frameInkBreaks: 0,
    paperTexture: true,
    paperTextureOpacity: 0.18,
    paperTextureScale: 1.1,
    imageDistort: false,
    imageDistortAmount: 13,
    imageDistortTurbulence: 0.015,
    imageDistortOctaves: 2,
    imageDistortBlur: 0.35,
    imageErode: false,
    imageErodeOverText: true,
    imageErodeAmount: 0.012,
    imageErodeScale: 1.8,
    imageErodeOpacity: 0.18,
    imageErodeSoftness: 0.4,
    imageErodeContrast: 0.68,
    imageErodeVariation: 0.6,
    imageErodeVariationScale: 0.32,
    interactiveTilt: false,
    tiltAmount: 6,
    course: 'Webflow for Marketers',
    stampCount: 1,
    dateLabel: '16.07.2026',
    fontFamily: STAMP_FONT_OPTIONS['Instrument Sans'],
    fontWeight: 500,
    letterSpacing: -1.5,
    titleFontSize: 32,
    titleMaxWidth: 44,
    dateFontSize: 22,
    showLogo: true,
    logoSize: 40,
    textOpacity: 1,
    textGlitch: false,
    textGlitchAmount: 2,
    textGlitchBleed: 0.2,
    textGlitchSlice: 0.14,
    textGlitchErode: 0,
    textGlitchErodeOpacity: 0.6,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
    rotation: 0,
    paperBorder: 28,
    perforationCount: 22,
    perforationRadius: 18,
    edgeRoughness: 16,
    grainFrequency: 0.018,
    grainOctaves: 2,
    seed: 11,
    surfaceBlur: 18,
    surfaceScale: 2.4,
    specularStrength: 0.08,
    specularExponent: 68,
    highlightOpacity: 0.06,
    lightZ: 1375,
    pointerLight: true,
    showShadow: true,
    shadowBlur: 22,
    shadowX: 6,
    shadowY: 14,
  },
  'Soft letterpress': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 1.2,
    frameInkBlur: 0.35,
    frameInkTurbulence: 0.008,
    frameInkBreaks: 0.22,
    paperTexture: true,
    paperTextureScale: 0.9,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.01,
    imageErodeScale: 1.6,
    imageErodeOpacity: 0.18,
    imageErodeSoftness: 0.65,
    imageErodeContrast: 0.55,
    imageErodeVariation: 0.4,
    imageErodeVariationScale: 0.3,
    textGlitch: true,
    textGlitchAmount: 1.5,
    textGlitchBleed: 0.25,
    textGlitchSlice: 0.12,
    textGlitchErode: 0.12,
    textGlitchErodeOpacity: 0.55,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['3:2'],
    fontFamily: STAMP_FONT_OPTIONS['Libre Baskerville'],
    fontWeight: 400,
    letterSpacing: 1.25,
    titleFontSize: 40,
    dateFontSize: 18,
    showLogo: true,
    logoSize: 88,
    interactiveTilt: false,
    rotation: -2,
    surfaceScale: 3.6,
    specularStrength: 0.1,
    highlightOpacity: 0.08,
  },
  'Worn print': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    paperTextureOpacity: 0.34,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 2.8,
    frameInkBlur: 0.55,
    frameInkTurbulence: 0.012,
    frameInkBreaks: 0.48,
    paperTexture: true,
    paperTextureScale: 0.75,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.02,
    imageErodeScale: 1.85,
    imageErodeOpacity: 0.22,
    imageErodeSoftness: 0.45,
    imageErodeContrast: 0.7,
    imageErodeVariation: 0.72,
    imageErodeVariationScale: 0.28,
    textGlitch: true,
    textGlitchAmount: 2.5,
    textGlitchBleed: 0.35,
    textGlitchSlice: 0.18,
    textGlitchErode: 0.22,
    textGlitchErodeOpacity: 0.75,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
    fontFamily: STAMP_FONT_OPTIONS['Playfair Display'],
    fontWeight: 500,
    letterSpacing: 0.5,
    titleFontSize: 52,
    dateFontSize: 26,
    showLogo: true,
    logoSize: 120,
    interactiveTilt: false,
    rotation: -4,
    edgeRoughness: 20,
    seed: 42,
  },
  'Heavy distress': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 5.5,
    frameInkBlur: 1.1,
    frameInkTurbulence: 0.02,
    frameInkBreaks: 0.78,
    paperTexture: true,
    paperTextureOpacity: 0.4,
    paperTextureScale: 0.65,
    imageDistort: true,
    imageDistortAmount: 13,
    imageDistortTurbulence: 0.015,
    imageDistortOctaves: 2,
    imageDistortBlur: 0.35,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.045,
    imageErodeScale: 1.4,
    imageErodeOpacity: 0.32,
    imageErodeSoftness: 0.35,
    imageErodeContrast: 0.82,
    imageErodeVariation: 0.85,
    imageErodeVariationScale: 0.22,
    interactiveTilt: true,
    tiltAmount: 10,
    stampCount: 1,
    dateLabel: 'Jul 16 2026',
    fontFamily: STAMP_FONT_OPTIONS['Instrument Serif'],
    fontWeight: 400,
    letterSpacing: 0.75,
    titleFontSize: 56,
    dateFontSize: 30,
    showLogo: true,
    logoSize: 110,
    textOpacity: 1,
    textGlitch: true,
    textGlitchAmount: 6,
    textGlitchBleed: 0.7,
    textGlitchSlice: 0.35,
    textGlitchErode: 0.4,
    textGlitchErodeOpacity: 0.9,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
    rotation: -7,
    paperBorder: 33,
    perforationCount: 27,
    perforationRadius: 18,
    edgeRoughness: 24,
    grainFrequency: 0.018,
    grainOctaves: 2,
    seed: 42,
    surfaceBlur: 18,
    surfaceScale: 1.8,
    specularStrength: 0.16,
    specularExponent: 68,
    highlightOpacity: 0.14,
    lightZ: 1375,
    pointerLight: false,
    showShadow: true,
    shadowBlur: 32,
    shadowX: 12,
    shadowY: 26,
  },
  'Dark gallery': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 3.5,
    frameInkBlur: 0.75,
    frameInkTurbulence: 0.01,
    frameInkBreaks: 0.4,
    paperTexture: true,
    paperTextureScale: 0.85,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.01,
    imageErodeScale: 1.95,
    imageErodeOpacity: 0.2,
    imageErodeSoftness: 0.5,
    imageErodeContrast: 0.7,
    imageErodeVariation: 0.55,
    imageErodeVariationScale: 0.35,
    textGlitch: true,
    textGlitchAmount: 2,
    textGlitchBleed: 0.15,
    textGlitchSlice: 0.15,
    textGlitchErode: 0.08,
    textGlitchErodeOpacity: 0.7,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['4:5'],
    fontFamily: STAMP_FONT_OPTIONS['DM Serif Display'],
    fontWeight: 400,
    letterSpacing: 1.5,
    titleFontSize: 48,
    dateFontSize: 20,
    showLogo: true,
    logoSize: 100,
    interactiveTilt: true,
    tiltAmount: 9,
    rotation: -5,
    showShadow: true,
    shadowBlur: 32,
    shadowX: 12,
    shadowY: 26,
    highlightOpacity: 0.14,
    specularStrength: 0.16,
  },
  'Crisp product': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: false,
    frameInkBreaks: 0,
    paperTexture: true,
    paperTextureOpacity: 0.16,
    paperTextureScale: 1.35,
    imageDistort: false,
    imageErode: false,
    textGlitch: false,
    textGlitchErode: 0,
    interactiveTilt: false,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:10'],
    rotation: 0,
    outlineWidth: 2,
    edgeRoughness: 10,
    showShadow: true,
    shadowOpacity: 0.24,
    shadowBlur: 18,
    shadowX: 4,
    shadowY: 10,
    fontFamily: STAMP_FONT_OPTIONS['WF Sans'],
    fontWeight: 600,
    letterSpacing: 0,
    titleFontSize: 36,
    dateFontSize: 16,
    showLogo: true,
    logoSize: 72,
    surfaceScale: 1.8,
    highlightOpacity: 0.04,
    pointerLight: false,
  },
  'Mono archive': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 0.8,
    frameInkBlur: 0.15,
    frameInkTurbulence: 0.006,
    frameInkBreaks: 0.12,
    paperTexture: true,
    paperTextureOpacity: 0.22,
    paperTextureScale: 1.4,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: false,
    imageErodeAmount: 0.008,
    imageErodeScale: 2.1,
    imageErodeOpacity: 0.12,
    imageErodeSoftness: 0.3,
    imageErodeContrast: 0.6,
    imageErodeVariation: 0.25,
    imageErodeVariationScale: 0.5,
    textGlitch: false,
    textGlitchErode: 0,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['1:1'],
    fontFamily: STAMP_FONT_OPTIONS['IBM Plex Mono'],
    fontWeight: 500,
    letterSpacing: 2.5,
    titleFontSize: 28,
    dateFontSize: 14,
    showLogo: false,
    logoSize: 80,
    dateLabel: '16.07.2026',
    interactiveTilt: false,
    rotation: 0,
    paperBorder: 40,
    perforationCount: 22,
    edgeRoughness: 12,
    surfaceScale: 2,
    highlightOpacity: 0.05,
  },
  'Poster bold': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: false,
    frameDistort: true,
    frameInkDisplacement: 2,
    frameInkBlur: 0.4,
    frameInkTurbulence: 0.01,
    frameInkBreaks: 0.3,
    paperTexture: true,
    paperTextureOpacity: 0.3,
    paperTextureScale: 0.7,
    imageDistort: false,
    imageDistortAmount: 13,
    imageDistortTurbulence: 0.015,
    imageDistortOctaves: 2,
    imageDistortBlur: 0.35,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.015,
    imageErodeScale: 1.2,
    imageErodeOpacity: 0.2,
    imageErodeSoftness: 0.55,
    imageErodeContrast: 0.65,
    imageErodeVariation: 0.5,
    imageErodeVariationScale: 0.4,
    interactiveTilt: true,
    tiltAmount: 6,
    course: 'Webflow for Marketers',
    stampCount: 1,
    dateLabel: '16.07.2026',
    fontFamily: STAMP_FONT_OPTIONS['Big Shoulders Display'],
    fontWeight: 900,
    letterSpacing: -2.5,
    titleFontSize: 72,
    titleMaxWidth: 68,
    dateFontSize: 38,
    showLogo: true,
    logoSize: 140,
    textOpacity: 1,
    textGlitch: true,
    textGlitchAmount: 1,
    textGlitchBleed: 0.1,
    textGlitchSlice: 0.08,
    textGlitchErode: 0,
    textGlitchErodeOpacity: 0.6,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['4:5'],
    rotation: 3,
    paperBorder: 28,
    perforationCount: 22,
    perforationRadius: 18,
    edgeRoughness: 16,
    grainFrequency: 0.018,
    grainOctaves: 2,
    seed: 11,
    surfaceBlur: 18,
    surfaceScale: 4,
    specularStrength: 0.08,
    specularExponent: 68,
    highlightOpacity: 0.05,
    lightZ: 1375,
    pointerLight: false,
    showShadow: true,
    shadowBlur: 26,
    shadowX: 8,
    shadowY: 18,
  },
  'Editorial serif': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 1.6,
    frameInkBlur: 0.5,
    frameInkTurbulence: 0.009,
    frameInkBreaks: 0.18,
    paperTexture: true,
    paperTextureOpacity: 0.26,
    paperTextureScale: 1,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.006,
    imageErodeScale: 1.7,
    imageErodeOpacity: 0.16,
    imageErodeSoftness: 0.7,
    imageErodeContrast: 0.5,
    imageErodeVariation: 0.45,
    imageErodeVariationScale: 0.25,
    textGlitch: true,
    textGlitchAmount: 0.5,
    textGlitchBleed: 0.2,
    textGlitchSlice: 0.1,
    textGlitchErode: 0.06,
    textGlitchErodeOpacity: 0.45,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['3:2'],
    fontFamily: STAMP_FONT_OPTIONS['Playfair Display'],
    fontWeight: 400,
    letterSpacing: 3,
    titleFontSize: 42,
    dateFontSize: 24,
    showLogo: true,
    logoSize: 90,
    interactiveTilt: false,
    rotation: -1,
    surfaceScale: 4,
    specularStrength: 0.08,
  },
  'Stacked deck': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 2.2,
    frameInkBlur: 0.45,
    frameInkTurbulence: 0.01,
    frameInkBreaks: 0.35,
    paperTexture: true,
    paperTextureOpacity: 0.28,
    paperTextureScale: 0.9,
    imageDistort: false,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.012,
    imageErodeScale: 1.8,
    imageErodeOpacity: 0.18,
    imageErodeSoftness: 0.4,
    imageErodeContrast: 0.68,
    imageErodeVariation: 0.6,
    imageErodeVariationScale: 0.32,
    textGlitch: true,
    textGlitchAmount: 2,
    textGlitchBleed: 0.2,
    textGlitchSlice: 0.14,
    textGlitchErode: 0.1,
    textGlitchErodeOpacity: 0.6,
    stampCount: 3,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['16:9'],
    fontFamily: STAMP_FONT_OPTIONS['Space Grotesk'],
    fontWeight: 600,
    letterSpacing: 0,
    titleFontSize: 34,
    dateFontSize: 16,
    showLogo: true,
    logoSize: 70,
    interactiveTilt: false,
    rotation: -3,
    showShadow: true,
    shadowBlur: 26,
    shadowX: 8,
    shadowY: 18,
  },
  'Typewriter memo': {
    lightMode: false,
    ...THEME_STAMP_CONTROLS.dark,
    stampFrame: true,
    frameDistort: true,
    frameInkDisplacement: 4,
    frameInkBlur: 0.9,
    frameInkTurbulence: 0.016,
    frameInkBreaks: 0.55,
    paperTexture: true,
    paperTextureOpacity: 0.22,
    paperTextureScale: 0.55,
    imageDistort: true,
    imageDistortAmount: 8,
    imageDistortTurbulence: 0.012,
    imageDistortOctaves: 2,
    imageDistortBlur: 0.2,
    imageErode: true,
    imageErodeOverText: true,
    imageErodeAmount: 0.03,
    imageErodeScale: 1.5,
    imageErodeOpacity: 0.28,
    imageErodeSoftness: 0.25,
    imageErodeContrast: 0.78,
    imageErodeVariation: 0.7,
    imageErodeVariationScale: 0.2,
    textGlitch: true,
    textGlitchAmount: 8,
    textGlitchBleed: 0.9,
    textGlitchSlice: 0.55,
    textGlitchErode: 0.35,
    textGlitchErodeOpacity: 0.85,
    stampCount: 1,
    aspectRatio: STAMP_ASPECT_RATIO_OPTIONS['4:3'],
    fontFamily: STAMP_FONT_OPTIONS.Typewriter,
    fontWeight: 400,
    letterSpacing: 1,
    titleFontSize: 32,
    dateFontSize: 20,
    showLogo: false,
    logoSize: 80,
    dateLabel: 'JUL 16 / 26',
    interactiveTilt: true,
    tiltAmount: 12,
    rotation: 6,
    paperBorder: 48,
    perforationCount: 18,
    perforationRadius: 22,
    edgeRoughness: 22,
    seed: 77,
    grainOctaves: 2,
    highlightOpacity: 0.18,
    pointerLight: true,
  },
} as const;

const SETTINGS_KEYS = [
  'lightMode',
  'stampFrame',
  'frameDistort',
  'frameInkDisplacement',
  'frameInkBlur',
  'frameInkTurbulence',
  'frameInkBreaks',
  'paperTexture',
  'paperTextureOpacity',
  'paperTextureScale',
  'imageDistort',
  'imageDistortAmount',
  'imageDistortTurbulence',
  'imageDistortOctaves',
  'imageDistortBlur',
  'imageErode',
  'imageErodeOverText',
  'imageErodeAmount',
  'imageErodeScale',
  'imageErodeOpacity',
  'imageErodeSoftness',
  'imageErodeContrast',
  'imageErodeVariation',
  'imageErodeVariationScale',
  'interactiveTilt',
  'tiltAmount',
  'course',
  'stampCount',
  'dateLabel',
  'fontFamily',
  'fontWeight',
  'letterSpacing',
  'titleFontSize',
  'titleMaxWidth',
  'dateFontSize',
  'showLogo',
  'logoSize',
  'textOpacity',
  'textGlitch',
  'textGlitchAmount',
  'textGlitchBleed',
  'textGlitchSlice',
  'textGlitchErode',
  'textGlitchErodeOpacity',
  'aspectRatio',
  'rotation',
  'paperBorder',
  'perforationCount',
  'perforationRadius',
  'outlineColor',
  'outlineWidth',
  'edgeRoughness',
  'grainFrequency',
  'grainOctaves',
  'seed',
  'surfaceBlur',
  'surfaceScale',
  'specularStrength',
  'specularExponent',
  'highlightOpacity',
  'lightZ',
  'pointerLight',
  'showShadow',
  'shadowOpacity',
  'shadowBlur',
  'shadowX',
  'shadowY',
] as const;

type SettingsSnapshot = Record<(typeof SETTINGS_KEYS)[number], unknown>;

function snapshotFromControls(source: Record<string, unknown>): SettingsSnapshot {
  return Object.fromEntries(
    SETTINGS_KEYS.map((key) => [key, source[key]])
  ) as SettingsSnapshot;
}

function settingsEqual(a: SettingsSnapshot, b: SettingsSnapshot) {
  return SETTINGS_KEYS.every((key) => Object.is(a[key], b[key]));
}

function StampSVGPage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const spaceDownRef = useRef(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [savedSetups, setSavedSetups] = useState<SavedSetupsMap>(() => loadSavedSetups());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [setupNameDraft, setSetupNameDraft] = useState('');
  const setupNameInputRef = useRef<HTMLInputElement>(null);
  const panSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const centerView = (scale = 1) => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    setView({
      scale: nextScale,
      x: (viewport.clientWidth - sw * nextScale) / 2,
      y: (viewport.clientHeight - sh * nextScale) / 2,
    });
  };

  const [controls, setControls] = useControls(() => ({
    Appearance: folder({
      lightMode: {
        value: DEFAULT_PAGE_SETTINGS.lightMode,
        label: 'Light mode',
      },
      stampFrame: {
        value: DEFAULT_PAGE_SETTINGS.stampFrame,
        label: 'Stamp frame',
      },
      frameDistort: {
        value: DEFAULT_PAGE_SETTINGS.frameDistort,
        label: 'Frame distortion',
      },
      frameInkDisplacement: {
        value: DEFAULT_PAGE_SETTINGS.frameInkDisplacement,
        min: 0,
        max: 20,
        step: 0.1,
        label: 'Frame ink displacement',
      },
      frameInkBlur: {
        value: DEFAULT_PAGE_SETTINGS.frameInkBlur,
        min: 0,
        max: 4,
        step: 0.025,
        label: 'Frame ink blur',
      },
      frameInkTurbulence: {
        value: DEFAULT_PAGE_SETTINGS.frameInkTurbulence,
        min: 0,
        max: 0.2,
        step: 0.001,
        label: 'Frame ink turbulence',
      },
      frameInkBreaks: {
        value: DEFAULT_PAGE_SETTINGS.frameInkBreaks,
        min: 0,
        max: 1,
        step: 0.005,
        label: 'Frame ink breaks',
      },
      paperTexture: {
        value: DEFAULT_PAGE_SETTINGS.paperTexture,
        label: 'Print texture (paper + image)',
      },
      paperTextureOpacity: {
        value: DEFAULT_PAGE_SETTINGS.paperTextureOpacity,
        min: 0,
        max: 0.5,
        step: 0.01,
        label: 'Texture strength',
      },
      paperTextureScale: {
        value: DEFAULT_PAGE_SETTINGS.paperTextureScale,
        min: 0.2,
        max: 2.2,
        step: 0.05,
        label: 'Texture scale (finer →)',
      },
      imageDistort: {
        value: DEFAULT_PAGE_SETTINGS.imageDistort,
        label: 'Image distort',
      },
      imageDistortAmount: {
        value: DEFAULT_PAGE_SETTINGS.imageDistortAmount,
        min: 0,
        max: 60,
        step: 1,
        label: 'Image displacement',
      },
      imageDistortTurbulence: {
        value: DEFAULT_PAGE_SETTINGS.imageDistortTurbulence,
        min: 0.001,
        max: 0.2,
        step: 0.001,
        label: 'Image turbulence',
      },
      imageDistortOctaves: {
        value: DEFAULT_PAGE_SETTINGS.imageDistortOctaves,
        min: 1,
        max: 5,
        step: 1,
        label: 'Image noise octaves',
      },
      imageDistortBlur: {
        value: DEFAULT_PAGE_SETTINGS.imageDistortBlur,
        min: 0,
        max: 4,
        step: 0.05,
        label: 'Image distort blur',
      },
      imageErode: {
        value: DEFAULT_PAGE_SETTINGS.imageErode,
        label: 'Paper breaks overlay',
      },
      imageErodeOverText: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeOverText,
        label: 'Breaks over text / logo',
      },
      imageErodeAmount: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeAmount,
        min: 0,
        max: 0.25,
        step: 0.005,
        label: 'Break coverage',
      },
      imageErodeScale: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeScale,
        min: 0.15,
        max: 2.2,
        step: 0.05,
        label: 'Break scale (finer →)',
      },
      imageErodeOpacity: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeOpacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Erosion overlay opacity',
      },
      imageErodeSoftness: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeSoftness,
        min: 0,
        max: 3,
        step: 0.05,
        label: 'Break softness',
      },
      imageErodeContrast: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeContrast,
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Break contrast',
      },
      imageErodeVariation: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeVariation,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Break variation',
      },
      imageErodeVariationScale: {
        value: DEFAULT_PAGE_SETTINGS.imageErodeVariationScale,
        min: 0.05,
        max: 1.2,
        step: 0.01,
        label: 'Variation scale (finer pools →)',
      },
      interactiveTilt: {
        value: DEFAULT_PAGE_SETTINGS.interactiveTilt,
        label: 'Pointer tilt',
      },
      tiltAmount: {
        value: DEFAULT_PAGE_SETTINGS.tiltAmount,
        min: 0,
        max: 18,
        step: 0.5,
        label: 'Tilt amount',
      },
    }),
    Content: folder({
      course: {
        value: DEFAULT_PAGE_SETTINGS.course,
        options: courseOptions,
        label: 'Course',
      },
      stampCount: {
        value: DEFAULT_PAGE_SETTINGS.stampCount,
        min: 1,
        max: MAX_STAMP_COUNT,
        step: 1,
        label: 'Stamp count',
      },
      dateLabel: { value: DEFAULT_PAGE_SETTINGS.dateLabel, label: 'Date' },
    }),
    Typography: folder({
      fontFamily: {
        value: DEFAULT_PAGE_SETTINGS.fontFamily,
        options: fontOptions,
        label: 'Font',
      },
      fontWeight: {
        value: DEFAULT_PAGE_SETTINGS.fontWeight,
        min: 200,
        max: 900,
        step: 100,
        label: 'Weight',
      },
      letterSpacing: {
        value: DEFAULT_PAGE_SETTINGS.letterSpacing,
        min: -6,
        max: 12,
        step: 0.25,
        label: 'Letter spacing',
      },
      titleFontSize: {
        value: DEFAULT_PAGE_SETTINGS.titleFontSize,
        min: 14,
        max: 72,
        step: 1,
        label: 'Title size',
      },
      titleMaxWidth: {
        value: DEFAULT_PAGE_SETTINGS.titleMaxWidth,
        min: 20,
        max: 100,
        step: 1,
        label: 'Title max width %',
      },
      dateFontSize: {
        value: DEFAULT_PAGE_SETTINGS.dateFontSize,
        min: 12,
        max: 56,
        step: 1,
        label: 'Date size',
      },
      showLogo: {
        value: DEFAULT_PAGE_SETTINGS.showLogo,
        label: 'Webflow logo',
      },
      logoSize: {
        value: DEFAULT_PAGE_SETTINGS.logoSize,
        min: 40,
        max: 280,
        step: 2,
        label: 'Logo size',
      },
      textOpacity: {
        value: DEFAULT_PAGE_SETTINGS.textOpacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Text opacity',
      },
      textGlitch: {
        value: DEFAULT_PAGE_SETTINGS.textGlitch,
        label: 'Text glitch / distress',
      },
      textGlitchAmount: {
        value: DEFAULT_PAGE_SETTINGS.textGlitchAmount,
        min: 0,
        max: 24,
        step: 0.5,
        label: 'Slice displacement',
      },
      textGlitchBleed: {
        value: DEFAULT_PAGE_SETTINGS.textGlitchBleed,
        min: 0,
        max: 3,
        step: 0.05,
        label: 'Ink bleed',
      },
      textGlitchSlice: {
        value: DEFAULT_PAGE_SETTINGS.textGlitchSlice,
        min: 0.05,
        max: 1.8,
        step: 0.05,
        label: 'Slice frequency',
      },
      textGlitchErode: {
        value: DEFAULT_PAGE_SETTINGS.textGlitchErode,
        min: 0,
        max: 0.7,
        step: 0.02,
        label: 'Text break coverage',
      },
      textGlitchErodeOpacity: {
        value: DEFAULT_PAGE_SETTINGS.textGlitchErodeOpacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Text break overlay opacity',
      },
    }),
    Stamp: folder({
      aspectRatio: {
        value: DEFAULT_PAGE_SETTINGS.aspectRatio,
        options: aspectRatioOptions,
        label: 'Aspect ratio',
      },
      rotation: {
        value: DEFAULT_PAGE_SETTINGS.rotation,
        min: -24,
        max: 24,
        step: 0.5,
      },
      paperBorder: {
        value: DEFAULT_PAGE_SETTINGS.paperBorder,
        min: 0,
        max: 140,
        step: 1,
      },
      perforationCount: {
        value: DEFAULT_PAGE_SETTINGS.perforationCount,
        min: 4,
        max: 30,
        step: 1,
      },
      perforationRadius: {
        value: DEFAULT_PAGE_SETTINGS.perforationRadius,
        min: 5,
        max: 45,
        step: 1,
      },
    }),
    Filter: folder({
      outlineColor: {
        value: DEFAULT_PAGE_SETTINGS.outlineColor,
        label: 'Outline color',
      },
      outlineWidth: {
        value: DEFAULT_PAGE_SETTINGS.outlineWidth,
        min: 0,
        max: 40,
        step: 1,
      },
      edgeRoughness: {
        value: DEFAULT_PAGE_SETTINGS.edgeRoughness,
        min: 0,
        max: 30,
        step: 1,
      },
      grainFrequency: {
        value: DEFAULT_PAGE_SETTINGS.grainFrequency,
        min: 0.001,
        max: 0.08,
        step: 0.001,
      },
      grainOctaves: {
        value: DEFAULT_PAGE_SETTINGS.grainOctaves,
        min: 1,
        max: 4,
        step: 1,
      },
      seed: {
        value: DEFAULT_PAGE_SETTINGS.seed,
        min: 1,
        max: 100,
        step: 1,
      },
    }),
    Lighting: folder({
      surfaceBlur: {
        value: DEFAULT_PAGE_SETTINGS.surfaceBlur,
        min: 0,
        max: 30,
        step: 1,
        label: 'Light diffusion',
      },
      surfaceScale: {
        value: DEFAULT_PAGE_SETTINGS.surfaceScale,
        min: 0,
        max: 12,
        step: 0.1,
        label: 'Ridge scale',
      },
      specularStrength: {
        value: DEFAULT_PAGE_SETTINGS.specularStrength,
        min: 0,
        max: 4,
        step: 0.05,
      },
      specularExponent: {
        value: DEFAULT_PAGE_SETTINGS.specularExponent,
        min: 1,
        max: 120,
        step: 1,
      },
      highlightOpacity: {
        value: DEFAULT_PAGE_SETTINGS.highlightOpacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Highlight opacity',
      },
      lightZ: {
        value: DEFAULT_PAGE_SETTINGS.lightZ,
        min: 50,
        max: 1600,
        step: 25,
        label: 'Light size',
      },
      pointerLight: {
        value: DEFAULT_PAGE_SETTINGS.pointerLight,
        label: 'Shared pointer light',
      },
    }),
    Shadow: folder({
      showShadow: {
        value: DEFAULT_PAGE_SETTINGS.showShadow,
        label: 'Layered table shadow',
      },
      shadowOpacity: {
        value: DEFAULT_PAGE_SETTINGS.shadowOpacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Shadow strength',
      },
      shadowBlur: {
        value: DEFAULT_PAGE_SETTINGS.shadowBlur,
        min: 0,
        max: 50,
        step: 1,
      },
      shadowX: {
        value: DEFAULT_PAGE_SETTINGS.shadowX,
        min: -40,
        max: 40,
        step: 1,
      },
      shadowY: {
        value: DEFAULT_PAGE_SETTINGS.shadowY,
        min: -40,
        max: 50,
        step: 1,
      },
    }),
  }));

  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const setControlsRef = useRef(setControls);
  setControlsRef.current = setControls;
  const primaryStampRef = useRef<StampSVGHandle>(null);

  const historyRef = useRef<{
    past: SettingsSnapshot[];
    future: SettingsSnapshot[];
    applying: boolean;
  }>({ past: [], future: [], applying: false });
  const lastCommittedRef = useRef<SettingsSnapshot | null>(null);
  const historyDebounceRef = useRef<number | null>(null);
  const [historyUi, setHistoryUi] = useState(0);
  const bumpHistoryUi = () => setHistoryUi((value) => value + 1);

  if (lastCommittedRef.current === null) {
    lastCommittedRef.current = snapshotFromControls(controls as Record<string, unknown>);
  }

  const collectCurrentSettings = () =>
    snapshotFromControls(controlsRef.current as Record<string, unknown>);

  const clearHistoryDebounce = () => {
    if (historyDebounceRef.current !== null) {
      window.clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
  };

  const commitPendingHistory = () => {
    if (historyDebounceRef.current === null) return;
    clearHistoryDebounce();
    if (historyRef.current.applying) return;
    const current = collectCurrentSettings();
    const committed = lastCommittedRef.current;
    if (!committed || settingsEqual(current, committed)) return;
    historyRef.current.past.push(committed);
    if (historyRef.current.past.length > MAX_HISTORY) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
    lastCommittedRef.current = current;
    bumpHistoryUi();
  };

  const applySettings = (
    settings: Record<string, unknown>,
    options?: { recordHistory?: boolean }
  ) => {
    const recordHistory = options?.recordHistory !== false;
    const before = collectCurrentSettings();
    clearHistoryDebounce();
    historyRef.current.applying = true;

    const previousLight = controlsRef.current.lightMode;
    setControlsRef.current(settings);

    const finish = () => {
      const after = collectCurrentSettings();
      if (recordHistory && !settingsEqual(before, after)) {
        historyRef.current.past.push(before);
        if (historyRef.current.past.length > MAX_HISTORY) {
          historyRef.current.past.shift();
        }
        historyRef.current.future = [];
        bumpHistoryUi();
      }
      lastCommittedRef.current = after;
      historyRef.current.applying = false;
    };

    // Theme sync effect may overwrite outline/shadow after a lightMode flip — re-apply
    if (settings.lightMode !== undefined && settings.lightMode !== previousLight) {
      window.requestAnimationFrame(() => {
        setControlsRef.current(settings);
        window.requestAnimationFrame(finish);
      });
      return;
    }

    window.requestAnimationFrame(finish);
  };

  const undoSettings = () => {
    commitPendingHistory();
    const { past, future } = historyRef.current;
    if (!past.length) return;
    const current = collectCurrentSettings();
    const previous = past.pop()!;
    future.push(current);
    bumpHistoryUi();
    applySettings(previous, { recordHistory: false });
  };

  const redoSettings = () => {
    commitPendingHistory();
    const { past, future } = historyRef.current;
    if (!future.length) return;
    const current = collectCurrentSettings();
    const next = future.pop()!;
    past.push(current);
    if (past.length > MAX_HISTORY) past.shift();
    bumpHistoryUi();
    applySettings(next, { recordHistory: false });
  };

  const undoSettingsRef = useRef(undoSettings);
  undoSettingsRef.current = undoSettings;
  const redoSettingsRef = useRef(redoSettings);
  redoSettingsRef.current = redoSettings;
  const applySettingsRef = useRef(applySettings);
  applySettingsRef.current = applySettings;

  const applyPreset = (preset: (typeof STAMP_PRESETS)[keyof typeof STAMP_PRESETS]) => {
    applySettings(preset);
  };

  // Debounced history commits for live Leva tweaks (coalesces slider drags)
  useEffect(() => {
    if (historyRef.current.applying) return;
    const next = collectCurrentSettings();
    const committed = lastCommittedRef.current;
    if (!committed || settingsEqual(next, committed)) return;

    clearHistoryDebounce();
    historyDebounceRef.current = window.setTimeout(() => {
      historyDebounceRef.current = null;
      if (historyRef.current.applying) return;
      const current = collectCurrentSettings();
      const previous = lastCommittedRef.current;
      if (!previous || settingsEqual(current, previous)) return;
      historyRef.current.past.push(previous);
      if (historyRef.current.past.length > MAX_HISTORY) {
        historyRef.current.past.shift();
      }
      historyRef.current.future = [];
      lastCommittedRef.current = current;
      bumpHistoryUi();
    }, HISTORY_DEBOUNCE_MS);

    return () => clearHistoryDebounce();
  }, [controls]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || (key !== 'z' && key !== 'y')) return;

      // Keep native text undo inside the save-setup modal
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('.stamp-svg-page__modal')
      ) {
        return;
      }

      const isRedo =
        (key === 'z' && event.shiftKey) || (key === 'y' && !event.metaKey);
      const isUndo = key === 'z' && !event.shiftKey;

      if (!isUndo && !isRedo) return;
      event.preventDefault();
      if (isUndo) undoSettingsRef.current();
      else redoSettingsRef.current();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const savedSetupsRef = useRef(savedSetups);
  savedSetupsRef.current = savedSetups;
  const savedSetupControlsRef = useRef<{ setup: string }>({ setup: NO_SAVED_SETUP });
  const setSavedSetupControlsRef = useRef<(value: { setup: string }) => void>(() => {});

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  useControls(
    'History',
    () => ({
      status: {
        value:
          canUndo || canRedo
            ? `${historyRef.current.past.length} undo · ${historyRef.current.future.length} redo`
            : '⌘Z / Ctrl+Z',
        editable: false,
        label: 'Stack',
      },
      Undo: button(() => undoSettingsRef.current()),
      Redo: button(() => redoSettingsRef.current()),
    }),
    { collapsed: false },
    [canUndo, canRedo, historyUi]
  );

  const [, setViewControls] = useControls('View', () => ({
    zoomLevel: { value: '100%', editable: false, label: 'Zoom' },
    'Reset view': button(() => {
      centerView(1);
      setViewControls({ zoomLevel: '100%' });
    }),
  }));

  useEffect(() => {
    setViewControls({ zoomLevel: `${Math.round(view.scale * 100)}%` });
  }, [setViewControls, view.scale]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => centerView(1));
    return () => window.cancelAnimationFrame(frame);
  }, [controls.stampCount, controls.aspectRatio, controls.course]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const prev = viewRef.current;

      // Trackpad pinch (and ctrl/cmd+scroll) zooms; two-finger scroll pans
      const isZoomGesture = event.ctrlKey || event.metaKey;
      if (isZoomGesture) {
        const rect = viewport.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const zoomFactor = Math.exp(-event.deltaY * 0.0072);
        const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale * zoomFactor));
        if (nextScale === prev.scale) return;

        const contentX = (pointerX - prev.x) / prev.scale;
        const contentY = (pointerY - prev.y) / prev.scale;
        setView({
          scale: nextScale,
          x: pointerX - contentX * nextScale,
          y: pointerY - contentY * nextScale,
        });
        return;
      }

      setView({
        scale: prev.scale,
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      });
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      if (
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      spaceDownRef.current = true;
      setSpaceDown(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      spaceDownRef.current = false;
      setSpaceDown(false);
    };
    const onBlur = () => {
      spaceDownRef.current = false;
      setSpaceDown(false);
      panSessionRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Capture-phase pan so Space/middle-drag wins over stamp pointer handlers
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onPointerDown = (event: PointerEvent) => {
      const canPan =
        event.button === 1 || (event.button === 0 && spaceDownRef.current);
      if (!canPan) return;
      event.preventDefault();
      event.stopPropagation();
      viewport.setPointerCapture(event.pointerId);
      panSessionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
      };
      setIsPanning(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      const session = panSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      event.preventDefault();
      setView({
        scale: viewRef.current.scale,
        x: session.originX + (event.clientX - session.startX),
        y: session.originY + (event.clientY - session.startY),
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const session = panSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      panSessionRef.current = null;
      setIsPanning(false);
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    const onAuxClick = (event: MouseEvent) => {
      // Prevent middle-click autoscroll chrome
      if (event.button === 1) event.preventDefault();
    };

    viewport.addEventListener('pointerdown', onPointerDown, true);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    viewport.addEventListener('auxclick', onAuxClick);
    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown, true);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('auxclick', onAuxClick);
    };
  }, []);

  const exportOptionsRef = useRef({ themeVariables: true });

  const [exportControls, setExport] = useControls('Export', () => ({
    copyStatus: { value: 'Ready', editable: false, label: 'Status' },
    themeVariables: {
      value: true,
      // ON = CMS paste (Webflow theme tokens). OFF = self-contained visual match.
      label: 'Theme vars (CMS)',
    },
    'Copy JSON': button(() => {
      const settings = Object.fromEntries(
        SETTINGS_KEYS.map((key) => [key, controlsRef.current[key]])
      );
      const json = JSON.stringify(settings, null, 2);
      void navigator.clipboard.writeText(json).then(
        () => {
          setExport({ copyStatus: 'Copied ✓' });
          window.setTimeout(() => setExport({ copyStatus: 'Ready' }), 2000);
        },
        () => setExport({ copyStatus: 'Copy failed — check console' })
      );
      console.log('[StampSVG settings]\n' + json);
    }),
    'Copy SVG': button(() => {
      const stamp = primaryStampRef.current;
      if (!stamp) {
        setExport({ copyStatus: 'Copy failed — stamp not ready' });
        return;
      }
      const useThemeVariables = exportOptionsRef.current.themeVariables;
      setExport({
        copyStatus: useThemeVariables
          ? 'Copying SVG (CMS vars)…'
          : 'Copying SVG (self-contained)…',
      });
      void stamp
        .getSvgString({ preserveThemeVariables: useThemeVariables })
        .then((svg) => navigator.clipboard.writeText(svg))
        .then(() => {
          setExport({
            copyStatus: useThemeVariables
              ? 'SVG copied (CMS vars) ✓'
              : 'SVG copied (self-contained) ✓',
          });
          window.setTimeout(() => setExport({ copyStatus: 'Ready' }), 2000);
        })
        .catch((error: unknown) => {
          console.error('[StampSVG copy SVG]', error);
          setExport({ copyStatus: 'Copy failed — check console' });
        });
    }),
    'Export PNG': button(() => {
      const stamp = primaryStampRef.current;
      if (!stamp) {
        setExport({ copyStatus: 'Export failed — stamp not ready' });
        return;
      }
      const courseTitle = controlsRef.current.course || 'stamp';
      const slug = courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setExport({ copyStatus: 'Exporting…' });
      void stamp
        .exportPng(`stamp-${slug || 'export'}.png`)
        .then(() => {
          setExport({ copyStatus: 'PNG downloaded ✓' });
          window.setTimeout(() => setExport({ copyStatus: 'Ready' }), 2000);
        })
        .catch((error: unknown) => {
          console.error('[StampSVG export]', error);
          setExport({ copyStatus: 'Export failed — check console' });
        });
    }),
  }));

  exportOptionsRef.current.themeVariables = Boolean(exportControls.themeVariables);

  const setupOptions = useMemo(() => setupSelectOptions(savedSetups), [savedSetups]);
  const setupOptionsKey = useMemo(
    () => Object.keys(setupOptions).join('|'),
    [setupOptions]
  );

  const [savedSetupControls, setSavedSetupControls] = useControls(
    'Saved setups',
    () => ({
      setup: {
        value: NO_SAVED_SETUP,
        options: setupOptions,
        label: 'Setup',
      },
      'Save current…': button(() => {
        setSetupNameDraft('');
        setSaveModalOpen(true);
      }),
      'Load setup': button(() => {
        const name = savedSetupControlsRef.current.setup;
        if (!name || name === NO_SAVED_SETUP) return;
        const setup = savedSetupsRef.current[name];
        if (!setup || typeof setup !== 'object') return;
        applySettings(setup);
      }),
      'Delete setup': button(() => {
        const name = savedSetupControlsRef.current.setup;
        if (!name || name === NO_SAVED_SETUP) return;
        const next = { ...savedSetupsRef.current };
        delete next[name];
        persistSavedSetups(next);
        setSavedSetups(next);
        setSavedSetupControlsRef.current({ setup: NO_SAVED_SETUP });
      }),
    }),
    { collapsed: false },
    [setupOptionsKey]
  );

  savedSetupControlsRef.current = savedSetupControls;
  setSavedSetupControlsRef.current = setSavedSetupControls;

  const confirmSaveSetup = () => {
    const name = setupNameDraft.trim();
    if (!name) return;
    const next = {
      ...savedSetupsRef.current,
      [name]: collectCurrentSettings(),
    };
    persistSavedSetups(next);
    setSavedSetups(next);
    setSaveModalOpen(false);
    setSetupNameDraft('');
    window.requestAnimationFrame(() => {
      setSavedSetupControlsRef.current({ setup: name });
    });
  };

  // Selecting a setup from the dropdown restores it immediately
  const previousSelectedSetupRef = useRef(NO_SAVED_SETUP);
  useEffect(() => {
    const name = savedSetupControls.setup;
    if (name === previousSelectedSetupRef.current) return;
    previousSelectedSetupRef.current = name;
    if (!name || name === NO_SAVED_SETUP) return;
    const setup = savedSetupsRef.current[name];
    if (!setup || typeof setup !== 'object') return;
    applySettingsRef.current(setup);
  }, [savedSetupControls.setup]);

  useControls(
    'Presets',
    () =>
      Object.fromEntries(
        Object.entries(STAMP_PRESETS).map(([name, preset]) => [
          name,
          button(() => applyPreset(preset)),
        ])
      ),
    { collapsed: false }
  );

  useEffect(() => {
    if (!saveModalOpen) return;
    const frame = window.requestAnimationFrame(() => {
      setupNameInputRef.current?.focus();
      setupNameInputRef.current?.select();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSaveModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [saveModalOpen]);

  const theme = controls.lightMode ? 'light' : 'dark';
  const previousThemeRef = useRef(theme);

  useEffect(() => {
    if (previousThemeRef.current === theme) return;
    previousThemeRef.current = theme;
    setControls(THEME_STAMP_CONTROLS[theme]);
  }, [setControls, theme]);

  const course =
    COURSE_STAMPS.find((candidate) => candidate.title === controls.course) ?? COURSE_STAMPS[0];
  const startIndex = COURSE_STAMPS.indexOf(course);
  const stampCount = Math.max(
    1,
    Math.min(MAX_STAMP_COUNT, Math.round(controls.stampCount))
  );
  const displayedCourses = Array.from(
    { length: stampCount },
    (_, index) => COURSE_STAMPS[(startIndex + index) % COURSE_STAMPS.length]
  );

  return (
    <main className="stamp-svg-page" data-page-theme={theme}>
      <div
        ref={viewportRef}
        className={[
          'stamp-svg-page__viewport',
          spaceDown ? 'stamp-svg-page__viewport--pan-ready' : '',
          isPanning ? 'stamp-svg-page__viewport--panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDoubleClick={() => centerView(1)}
      >
        <div
          ref={stageRef}
          className="stamp-svg-page__stage"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          {displayedCourses.map((displayedCourse, index) => (
            <div
              key={displayedCourse.title}
              className="stamp-svg-page__stamp"
              style={{
                marginLeft: index > 0 ? '-28px' : 0,
                zIndex: index + 1,
              }}
            >
              <StampSVG
                ref={index === 0 ? primaryStampRef : undefined}
                image={{ src: displayedCourse.image, alt: displayedCourse.title }}
                title={displayedCourse.title}
                dateLabel={controls.dateLabel}
                showLogo={controls.showLogo}
                logoSize={controls.logoSize}
                fontFamily={controls.fontFamily}
                fontWeight={controls.fontWeight}
                letterSpacing={controls.letterSpacing}
                titleFontSize={controls.titleFontSize}
                titleMaxWidth={controls.titleMaxWidth}
                dateFontSize={controls.dateFontSize}
                textOpacity={controls.textOpacity}
                textGlitch={controls.textGlitch}
                textGlitchAmount={controls.textGlitchAmount}
                textGlitchBleed={controls.textGlitchBleed}
                textGlitchSlice={controls.textGlitchSlice}
                textGlitchErode={controls.textGlitchErode}
                textGlitchErodeOpacity={controls.textGlitchErodeOpacity}
                aspectRatio={controls.aspectRatio}
                rotation={
                  controls.rotation +
                  (stampCount > 1 ? STAMP_ROTATION_OFFSETS[index] ?? 0 : 0)
                }
                paperBorder={controls.paperBorder}
                perforationCount={controls.perforationCount}
                perforationRadius={controls.perforationRadius}
                stampFrame={controls.stampFrame}
                frameDistort={controls.frameDistort}
                frameInkDisplacement={controls.frameInkDisplacement}
                frameInkBlur={controls.frameInkBlur}
                frameInkTurbulence={controls.frameInkTurbulence}
                frameInkBreaks={controls.frameInkBreaks}
                paperTexture={controls.paperTexture}
                paperTextureOpacity={controls.paperTextureOpacity}
                paperTextureScale={controls.paperTextureScale}
                paperTextureDarkInk={controls.lightMode}
                imageDistort={controls.imageDistort}
                imageDistortAmount={controls.imageDistortAmount}
                imageDistortTurbulence={controls.imageDistortTurbulence}
                imageDistortOctaves={controls.imageDistortOctaves}
                imageDistortBlur={controls.imageDistortBlur}
                imageErode={controls.imageErode}
                imageErodeOverText={controls.imageErodeOverText}
                imageErodeAmount={controls.imageErodeAmount}
                imageErodeScale={controls.imageErodeScale}
                imageErodeOpacity={controls.imageErodeOpacity}
                imageErodeSoftness={controls.imageErodeSoftness}
                imageErodeContrast={controls.imageErodeContrast}
                imageErodeVariation={controls.imageErodeVariation}
                imageErodeVariationScale={controls.imageErodeVariationScale}
                interactiveTilt={controls.interactiveTilt}
                tiltAmount={controls.tiltAmount}
                paperColor="var(--stamp-paper)"
                outlineColor={controls.outlineColor}
                outlineWidth={controls.outlineWidth}
                edgeRoughness={controls.edgeRoughness}
                grainFrequency={controls.grainFrequency}
                grainOctaves={controls.grainOctaves}
                seed={controls.seed + index}
                surfaceBlur={controls.surfaceBlur}
                surfaceScale={controls.surfaceScale}
                specularStrength={controls.specularStrength}
                specularExponent={controls.specularExponent}
                highlightOpacity={controls.highlightOpacity}
                lightZ={controls.lightZ}
                pointerLight={controls.pointerLight}
                showShadow={controls.showShadow}
                shadowOpacity={controls.shadowOpacity}
                shadowBlur={controls.shadowBlur}
                shadowX={controls.shadowX}
                shadowY={controls.shadowY}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="stamp-svg-page__hint">
        ⌘Z undo · ⌘⇧Z redo · Two-finger pan · Pinch zoom · Space/middle-drag pan ·
        Double-click reset
      </p>
      {saveModalOpen ? (
        <div
          className="stamp-svg-page__modal-backdrop"
          role="presentation"
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            className="stamp-svg-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stamp-svg-save-setup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="stamp-svg-save-setup-title" className="stamp-svg-page__modal-title">
              Save setup
            </h2>
            <p className="stamp-svg-page__modal-copy">
              Name this look so you can load it from Saved setups later.
            </p>
            <label className="stamp-svg-page__modal-label" htmlFor="stamp-svg-setup-name">
              Setup name
            </label>
            <input
              ref={setupNameInputRef}
              id="stamp-svg-setup-name"
              className="stamp-svg-page__modal-input"
              type="text"
              value={setupNameDraft}
              placeholder="e.g. Marketers deck"
              onChange={(event) => setSetupNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  confirmSaveSetup();
                }
              }}
            />
            <div className="stamp-svg-page__modal-actions">
              <button
                type="button"
                className="stamp-svg-page__modal-button stamp-svg-page__modal-button--ghost"
                onClick={() => setSaveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="stamp-svg-page__modal-button"
                disabled={!setupNameDraft.trim()}
                onClick={confirmSaveSetup}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default StampSVGPage;
