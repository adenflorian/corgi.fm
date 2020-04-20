import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {expMidiPatternsReducer, makeExpMidiPatternState, ExpMidiPatternState,
	expMidiPatternViewsReducer, ExpMidiPatternViewState, makeExpMidiPatternViewState,
	expMidiTimelineClipsReducer, ExpMidiTimelineClipState, makeExpMidiTimelineClipState,
	expMidiTimelineTracksReducer, ExpMidiTimelineTrackState, makeExpMidiTimelineTrackState,
} from '.'

export function makeExpMidiState(state: Partial<ExpMidiState> = {}): ExpMidiState {
	return {
		patterns: Map<Id, ExpMidiPatternState>(state.patterns || []).map(makeExpMidiPatternState),
		patternViews: Map<Id, ExpMidiPatternViewState>(state.patternViews || []).map(makeExpMidiPatternViewState),
		timelineClips: Map<Id, ExpMidiTimelineClipState>(state.timelineClips || []).map(makeExpMidiTimelineClipState),
		timelineTracks: Map<Id, ExpMidiTimelineTrackState>(state.timelineTracks || []).map(makeExpMidiTimelineTrackState),
	}
}

export type ExpMidiState = ReturnType<typeof expMidiReducer>

export const expMidiReducer = combineReducers({
	patterns: expMidiPatternsReducer,
	patternViews: expMidiPatternViewsReducer,
	timelineClips: expMidiTimelineClipsReducer,
	timelineTracks: expMidiTimelineTracksReducer,
})
