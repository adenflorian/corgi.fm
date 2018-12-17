import {expect} from 'chai'
import {isProdServer} from './is-prod-server'

describe('is-prod-server', () => {
	let originalNodeEnv: any

	beforeEach(() => (originalNodeEnv = process.env.NODE_ENV))
	afterEach(() => (process.env.NODE_ENV = originalNodeEnv))

	describe('isProdServer', () => {
		[
			{
				NODE_ENV: 'development',
				expected: false,
			},
			{
				NODE_ENV: 'production',
				expected: true,
			},
		].forEach(test => {
			it(test.NODE_ENV, () => {
				process.env.NODE_ENV = test.NODE_ENV
				expect(isProdServer()).to.equal(test.expected)
			})
		})
	})
})
