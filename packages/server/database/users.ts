import {Db} from 'mongodb'
import {UserUpdate, User} from '@corgifm/common/models/User'
import {RequiredField} from '@corgifm/common/common-types'
import {transformAndValidate} from '../server-validation'

export const usersQueries = (db: Db) => {
	const usersCollection = db.collection('users')

	return {
		collectionName: usersCollection.collectionName,
		async updateOrCreate(userUpdate: UserUpdate, uid: string) {
			const user: RequiredField<Partial<User>, 'uid'> = {
				uid,
				displayName: userUpdate.displayName,
			}

			await usersCollection
				.update({uid}, {$set: user}, {upsert: true})
		},
		async getByUid(uid: string): Promise<User | null> {
			const result = await usersCollection
				.findOne<User>({uid})

			if (result === null) return null

			return transformAndValidate(User, result)
		},
	} as const
}
