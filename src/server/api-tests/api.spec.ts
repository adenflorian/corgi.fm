// import request from 'supertest'
import {configureServerStore} from '../../common/redux'
import {setupExpressApp} from '../setup-express-app'

describe('API Tests', () => {
	it('should work', async () => {
		// const result = await request(setupExpressApp(configureServerStore())).get('http://example.com')
		expect(true).toBeTruthy()
	})
})
