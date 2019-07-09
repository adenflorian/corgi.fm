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
		app = await setupExpressApp(configureServerStore(), db, {
			jwtSecret: 'the jwtSecret',
		})
	})

	afterEach(async () => {
		await db.close()
	})

	describe('/api', () => {
		describe('/auth', () => {
			describe('/register', () => {
				it('should fail when password is number', async () => {
					const email = 'pit@random.dog'
					await request(app)
						.post('/api/auth/register')
						.send({email, password: 123453789})
						.expect(400)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							expect(await db.users.getUserByEmail(email)).toBeNull()
							expect(response.body).toEqual({
								message: 'password must be a string',
							})
						})
				})
				it('should fail when password is > 50', async () => {
					const email = 'lab@random.dog'
					await request(app)
						.post('/api/auth/register')
						.send({email, password: '111111111122222222223333333333444444444455555555556'})
						.expect(400)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							expect(await db.users.getUserByEmail(email)).toBeNull()
							expect(response.body).toEqual({
								message: 'password must be gte 8 and lte 50',
							})
						})
				})
				it('should fail when password is < 8', async () => {
					const email = 'lab@random.dog'
					await request(app)
						.post('/api/auth/register')
						.send({email, password: '1234567'})
						.expect(400)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							expect(await db.users.getUserByEmail(email)).toBeNull()
							expect(response.body).toEqual({
								message: 'password must be gte 8 and lte 50',
							})
						})
				})
				it('should fail when email exists', async () => {
					const email = 'bloodhound@random.dog'
					await request(app)
						.post('/api/auth/register')
						.send({email, password: 'bloodhound1'})
						.expect(200)

					await request(app)
						.post('/api/auth/register')
						.send({email, password: 'bloodhound2'})
						.expect(400)
						.expect('Content-Type', /application\/json/)
						.then(async response => {
							expect(await db.users.getUserByEmail(email)).toMatchObject({email})
							expect(response.body).toEqual({
								message: 'email exists',
							})
						})
				})
				it('should work', async () => {
					const email = 'corgi@random.dog'
					const password = 'corgi@random.dog123'
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

							// Make sure we got our token back
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
