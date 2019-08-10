import {Db} from 'mongodb'
import {UserUpdate, User} from '@corgifm/common/models/User'
import {upsertOneWhole, findOne, CorgiIndexes} from './database-utils'

export const usersQueries = async (db: Db) => {
	const usersCollection = db.collection<User>('users')

	await usersCollection.createIndexes([{
		key: {uid: 1},
		background: true,
		unique: true,
	}, {
		key: {displayName: 1},
		background: true,
	}] as CorgiIndexes<User>[])

	return {
		collectionName: usersCollection.collectionName,

		async updateOrCreate(userUpdate: UserUpdate, uid: Id) {
			return upsertOneWhole(usersCollection, {uid}, {...userUpdate, uid})
		},

		async getByUid(uid: Id) {
			return findOne(usersCollection, {uid}, User)
		},
	}
}
