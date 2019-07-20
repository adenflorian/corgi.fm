import {selectRoomStateByName} from '@corgifm/common/redux'
import * as Router from '@koa/router'
import {ServerStore} from '../server-redux-types'

export const stateRouter = (serverStore: ServerStore): Router => {
	const router = new Router()

	router.get('/', ctx => {
		ctx.body = serverStore.getState()
	})

	router.get('/:room', ctx => {
		ctx.body = selectRoomStateByName(
			serverStore.getState(), ctx.params.room) || {}
	})

	return router
}
