import {Application} from 'express'
import * as request from 'supertest'
import {isTokenHolder} from '../../common/common-types'
import {configureServerStore} from '../../common/redux'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

describe('API Tests', () => {
	let db: DBStore
	let app: Application

	beforeEach(async () => {
		db = await connectDB()
		app = setupExpressApp(configureServerStore(), db)
	})

	afterEach(async () => {
		await db.close()
	})

	describe('/api', () => {
		describe('/auth', () => {
			describe('/register', () => {
				it('should fail when password is number', async () => {
					const email = 'corgi@random.dog'
					await request(app)
						.post('/api/auth/register')
						.send({email, password: 123})
						.expect(400)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							expect(await db.users.getUserByEmail(email)).toBeNull()
							expect(response.body).toEqual({
								message: 'oops',
							})
						})
				})
				it('should work', async () => {
					const email = 'corgi@random.dog'
					const password = 'woof'
					await request(app)
						.post('/api/auth/register')
						.send({email, password})
						.expect(200)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							// Make sure email was saved
							const result = await db.users.getUserByEmail(email)
							expect(result!.email).toEqual(email)

							// Make sure password is hashed
							expect(result!.password).not.toEqual(password)

							expect(isTokenHolder(response.body)).toBeTruthy()
							if (!isTokenHolder(response.body)) throw fail('not a TokenHolder')
							expect(response.body).toMatchObject({
								/* cspell: disable-next-line */
								token: expect.stringMatching(/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/),
							})
							expect(Object.keys(response.body).sort()).toEqual(['token'])
						})
				})
			})
			describe('/login', () => {
				it('should work', async () => {
					await request(app)
						.post('/api/auth/login')
						.expect(200)
						.expect('Content-Type', /application\/json/)
				})
			})
		})
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
