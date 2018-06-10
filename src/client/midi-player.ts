import {Dispatch} from 'redux'
import {MidiNotes} from './music-types'
import {virtualKeyPressed, virtualKeyUp} from './redux/virtual-keyboard-redux'

/**
 * Plays one note at a time 1 second apart, looping
 */
export function play(dispatch: Dispatch, events: MidiNotes[]) {
	// dispatch(virtualKeyPressed('track-1', notes[0]))
	// setTimeout(() => {
	// 	dispatch(virtualKeyUp('track-1', notes[0]))
	// 	dispatch(virtualKeyPressed('track-1', notes[1]))
	// 	setTimeout(() => {
	// 		dispatch(virtualKeyUp('track-1', notes[1]))
	// 	}, 2000)
	// }, 2000)

	// return new Promise(resolve => {
	// 	setTimeout(() => {
	// 		dispatch(virtualKeyPressed('track-1', notes[0]))
	// 		setTimeout(() => {
	// 			dispatch(virtualKeyUp('track-1', notes[0]))
	// 			resolve()
	// 		}, 1000)
	// 	})
	// }

	// notes.forEach((note, index) => {
	// 	setTimeout(() => {
	// 		dispatch(virtualKeyPressed('track-1', note))
	// 		setTimeout(() => {
	// 			dispatch(virtualKeyUp('track-1', note))
	// 		}, 50)
	// 	}, index * 50)
	// })

	events.forEach((notes, index) => {
		setTimeout(() => {
			notes.forEach(note => {
				dispatch(virtualKeyPressed('track-1', note))
				setTimeout(() => {
					dispatch(virtualKeyUp('track-1', note))
				}, 100)
			})
		}, index * 150)
	})

	// function playNote() {
	// 	currentNote = notes[index]
	// 	dispatch(virtualKeyPressed('track-1', currentNote))
	// }
}
