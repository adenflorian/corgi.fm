import * as request from 'supertest'
import {configureServerStore} from '../../common/redux'
import {setupExpressApp} from '../setup-express-app'

describe('API Tests', () => {
	describe('/api', () => {
		describe('/auth', () => {
			describe('/register', () => {
				it('should work', async () => {
					const result = await request(setupExpressApp(configureServerStore())).post('/api/auth/register')
					expect(result.status).toEqual(200)
				})
			})
			describe('/login', () => {
				it('should work', async () => {
					const result = await request(setupExpressApp(configureServerStore())).post('/api/auth/login')
					expect(result.status).toEqual(200)
				})
			})
		})
	})
	describe('/newsletter', () => {
		it('should work', async () => {
			const result = await request(setupExpressApp(configureServerStore())).get('/newsletter')
			expect(result.status).toEqual(200)
		})
	})
})
