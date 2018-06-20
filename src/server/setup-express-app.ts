import * as express from 'express'
import * as path from 'path'

export function setupExpressApp(app: express.Application) {
	app.use(express.static(path.join(__dirname, '../client')))

	app.get('/', (_, res) => {
		res.sendFile(path.join(__dirname, '../client/index.html'))
	})
}
