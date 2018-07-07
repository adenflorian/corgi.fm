import * as express from 'express'
import * as path from 'path'
import {Store} from 'redux'

export function setupExpressApp(app: express.Application, store: Store) {
	app.use(express.static(path.join(__dirname, '../public')))

	app.get('/', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})

	app.get('/state', (_, res) => {
		res.json(store.getState())
	})
}
