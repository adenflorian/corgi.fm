import {Db} from 'mongodb'
import {UserUpdate, User} from '@corgifm/common/models/User'
import {transformAndValidateDbResult} from '@corgifm/common/validation'

export const usersQueries = (db: Db) => {
	const usersCollection = db.collection('users')

	return {
		collectionName: usersCollection.collectionName,

		async updateOrCreate(userUpdate: UserUpdate, uid: string) {
			const user: User = {...userUpdate, uid}

			await usersCollection.update({uid}, {$set: user}, {upsert: true})
		},

		async getByUid(uid: string): Promise<User | null> {
			const result = await usersCollection.findOne<User>({uid})

			if (result === null) return null

			return transformAndValidateDbResult(User, result)
		},
	} as const
}
