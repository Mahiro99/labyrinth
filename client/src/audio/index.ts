// audio — event-driven sound for Daily Maze. See audio.md for the design.
export { AudioEngine } from './AudioEngine'
export { useAudio } from './useAudio'
export { SOUNDS, THUNDERS, type SoundName, type SoundDef } from './sounds'
// landing-page background score (streaming, sequential-shuffle)
export { LandingMusic } from './landingMusic'
export { useLandingMusic } from './useLandingMusic'
