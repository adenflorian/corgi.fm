import * as express from 'express'
import * as path from 'path'
import {Store} from 'redux'
import {selectRoomStateByName} from '../common/redux/room-stores-redux'

export function setupExpressApp(app: express.Application, serverStore: Store) {
	app.use(express.static(path.join(__dirname, '../public')))

	app.get('/', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})

	app.get('/state', (_, res) => {
		res.json(serverStore.getState())
	})

	app.get('/state/:room', (req, res) => {
		res.json(selectRoomStateByName(serverStore.getState(), req.params.room))
	})
}
