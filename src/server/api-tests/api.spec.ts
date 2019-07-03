import * as request from 'supertest'
import {configureServerStore} from '../../common/redux'
import {setupExpressApp} from '../setup-express-app'

describe('API Tests', () => {
	describe('/api', () => {
		describe('/auth', () => {
			describe('/register', () => {
				it('should work', async () => {
					await request(setupExpressApp(configureServerStore()))
						.post('/api/auth/register')
						.expect(200)
				})
			})
			describe('/login', () => {
				it('should work', async () => {
					await request(setupExpressApp(configureServerStore()))
						.post('/api/auth/login')
						.expect(200)
				})
			})
		})
	})
	describe('/newsletter', () => {
		it('should work', async () => {
			await request(setupExpressApp(configureServerStore()))
				.get('/newsletter')
				.expect(200)
		})
	})
})
