import {isProdServer} from './is-prod-server'

describe('is-prod-server', () => {
	let originalNodeEnv: any

	beforeEach(() => (originalNodeEnv = process.env.CORGI_ENV))
	afterEach(() => (process.env.CORGI_ENV = originalNodeEnv))

	describe('isProdServer', () => {
		[
			{
				CORGI_ENV: 'dev',
				expected: false,
			},
			{
				CORGI_ENV: 'test',
				expected: false,
			},
			{
				CORGI_ENV: 'prod',
				expected: true,
			},
		].forEach(test => {
			it(test.CORGI_ENV, () => {
				process.env.CORGI_ENV = test.CORGI_ENV
				expect(isProdServer()).toEqual(test.expected)
			})
		})
	})
})
