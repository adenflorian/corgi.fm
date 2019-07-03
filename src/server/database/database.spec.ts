import {connectDB, DBStore} from './database'

describe('Database Tests', () => {
	let db: DBStore

	beforeEach(async () => {
		db = await connectDB()
	})

	afterEach(async () => {
		await db.close()
	})

	describe('saveUserConnectEventAsync', () => {
		it('should work', async () => {
			const result = await db.events.saveUserConnectEventAsync({
				username: 'test user',
				room: 'the room',
				time: new Date(123),
			})
			expect(result.insertedCount).toEqual(1)
		})
	})
})
