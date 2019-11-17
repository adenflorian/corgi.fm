import {Record} from 'immutable'
import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '..'

export const expGraphMetaActions = {
	add: (graph: ExpGraphMeta) => ({
		type: 'EXP_GRAPH_ADD',
		graph,
	})
} as const

export const defaultExpGraphMeta = Object.freeze({
	id: '-1' as Id,
	ownerId: '-1' as Id,
	version: '1.0.0',
	name: 'dummy',
})

const makeExpGraphMetaRecord = Record(defaultExpGraphMeta)

const defaultExpGraphMetaRecord = makeExpGraphMetaRecord()

export function makeExpGraphMeta(meta: Partial<typeof defaultExpGraphMeta> = {}): ExpGraphMeta {
	return makeExpGraphMetaRecord(meta)
		.set('id', meta.id || uuid.v4())
}

export interface ExpGraphMeta extends ReturnType<typeof makeExpGraphMetaRecord> {}

export type ExpGraphMetaRaw = typeof defaultExpGraphMeta

export interface ExpGraphMetaAction extends ActionType<typeof expGraphMetaActions> {}

export const expGraphMetaReducer: Reducer<ExpGraphMeta, ExpGraphMetaAction> = (
	state = defaultExpGraphMetaRecord, action,
) => {
	switch (action.type) {
		default: return state
	}
}
