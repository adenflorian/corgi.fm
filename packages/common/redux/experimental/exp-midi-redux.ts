import {Map, Record} from 'immutable'
import {Reducer, combineReducers} from 'redux'
import {expMidiPatternsReducer, makeExpMidiPatternState, ExpMidiPatternState} from './exp-midi-patterns-redux'

export function makeExpMidiState(state: Partial<ExpMidiState> = {}): ExpMidiState {
	return {
		patterns: Map<Id, ExpMidiPatternState>(state.patterns || []).map(makeExpMidiPatternState),
	}
}

export type ExpMidiState = ReturnType<typeof expMidiReducer>

export const expMidiReducer = combineReducers({
	patterns: expMidiPatternsReducer,
})