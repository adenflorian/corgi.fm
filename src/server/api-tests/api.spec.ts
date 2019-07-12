import {Application} from 'express'
import * as request from 'supertest'
import {configureServerStore} from '../../common/redux'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

describe('API Tests', () => {
	let db: DBStore
	let app: Application

	beforeEach(async () => {
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db, {})
	})

	afterEach(async () => {
		await db.close()
	})

	describe('/newsletter', () => {
		it('should work', async () => {
			await request(app)
				.get('/newsletter')
				.expect(200)
				.expect('Content-Type', /text\/html/)
		})
	})
})
