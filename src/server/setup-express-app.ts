import * as express from 'express'
import * as path from 'path'

export function setupExpressApp(app: express.Application, roomStores: any) {
	app.use(express.static(path.join(__dirname, '../public')))

	app.get('/', (_, res) => {
		res.sendFile(path.join(__dirname, '../public/index.html'))
	})

	app.get('/state/:room', (req, res) => {
		res.json(roomStores[req.params.room].getState())
	})
}
