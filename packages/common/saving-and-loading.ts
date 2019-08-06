import {Map} from 'immutable'
import {SavedRoom} from './redux'

export function transformLoadedSave(save: SavedRoom): SavedRoom {
	return enableNodesMaybe(save)
}

function enableNodesMaybe(save: SavedRoom): SavedRoom {
	const positions = Map(save.positions)

	if (positions.some(position => position.enabled === undefined)) {
		return {
			...save,
			positions: positions.map(x => ({...x, enabled: true}))
		}
	} else {
		return save
	}
}
