import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {expMidiPatternsReducer, makeExpMidiPatternState, ExpMidiPatternState,
	expMidiPatternViewsReducer, ExpMidiPatternViewState, makeExpMidiPatternViewState} from '.'

export function makeExpMidiState(state: Partial<ExpMidiState> = {}): ExpMidiState {
	return {
		patterns: Map<Id, ExpMidiPatternState>(state.patterns || []).map(makeExpMidiPatternState),
		patternViews: Map<Id, ExpMidiPatternViewState>(state.patternViews || []).map(makeExpMidiPatternViewState),
	}
}

export type ExpMidiState = ReturnType<typeof expMidiReducer>

export const expMidiReducer = combineReducers({
	patterns: expMidiPatternsReducer,
	patternViews: expMidiPatternViewsReducer,
})
