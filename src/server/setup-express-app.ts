import * as express from 'express'
import * as path from 'path'
import {Store} from 'redux'

export function setupExpressApp(app: express.Application, store: Store) {
	app.use(express.static(path.join(__dirname, '../client')))

	app.get('/', (_, res) => {
		res.sendFile(path.join(__dirname, '../client/index.html'))
	})

	app.get('/state', (_, res) => {
		res.json(store.getState())
	})
}
