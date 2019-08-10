import {connectDB, DBStore} from './database'
import {makeUser} from '@corgifm/common/models/User';

const uidA = 'uidA111Lp7TlwLzH4r2ivWTcu1C2'
const uidB = 'uidB222Lp7TlwLzH4r2ivWTcu1C2'

describe('Database Tests', () => {
	let db: DBStore

	beforeAll(async () => {
		db = await connectDB()
	})

	afterEach(async () => {
		await db.db.dropDatabase()
	})

	afterAll(async () => {
		await db.close()
	})

	describe('saveUserConnectEventAsync', () => {
		it('should work', async () => {
			const result = await db.events.saveUserConnectEventAsync({
				username: 'test user',
				room: 'the room',
				time: new Date(123),
			})
			expect(result).toEqual(1)
		})
	})

	describe('users', () => {
		test('unknown user', async () => {
			const result = await db.users.getByUid('fake-uid')
			expect(result).toBeNull()
		})
		test('existing user', async () => {
			await db.users.updateOrCreate({
				color: '#FF0000',
				displayName: 'bob',
			}, uidA)

			const result = await db.users.getByUid(uidA)

			if (!result) fail('expected not null')
			expect(result).toEqual(makeUser({
				color: '#FF0000',
				displayName: 'bob',
				uid: uidA,
			}))
		})
	})

	describe('uploads', () => {
		test('save upload', async () => {
			await db.uploads.put({
				ownerUid: uidA,
				path: 'user/uidA1.wav',
				sizeBytes: 350,
			})
			await db.uploads.put({
				ownerUid: uidB,
				path: 'user/uidB1.wav',
				sizeBytes: 400,
			})
			await db.uploads.put({
				ownerUid: uidA,
				path: 'user/uidA2.wav',
				sizeBytes: 700,
			})
			const size = await db.uploads.getTotalUploadBytesForUser(uidA)
			expect(size).toEqual(1050)
		})
	})
})
