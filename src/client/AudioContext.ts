// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
export const audioContext = new AudioContext()

export const masterVolume = audioContext.createGain()
