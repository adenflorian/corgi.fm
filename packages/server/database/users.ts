import {Db} from 'mongodb'
import {logger} from '@corgifm/common/logger'
import {UserUpdate, User} from '@corgifm/common/models/User'
import {RequiredField} from '@corgifm/common/common-types'
import {transformAndValidate} from '../server-validation'

const usersCollectionName = 'users'

export const usersQueries = (db: Db) => ({
	usersCollectionName,
	async updateOrCreate(userUpdate: UserUpdate, uid: string) {
		const startTime = Date.now()
		logger.debug('updateOrCreate: ', {user: userUpdate})

		const user: RequiredField<Partial<User>, 'uid'> = {
			uid,
			displayName: userUpdate.displayName,
		}

		const result = await db.collection(usersCollectionName)
			.update({uid}, {$set: user}, {upsert: true})

		logger.debug('updateOrCreate result: ', {
			result: result.result,
			time: `${Date.now() - startTime}ms`,
		})
	},
	async getByUid(uid: string): Promise<User | null> {
		const startTime = Date.now()
		logger.debug('getByUid: ', {uid})

		const result = await db.collection(usersCollectionName)
			.findOne<User>({uid})

		logger.debug('getByUid result: ', {
			result,
			time: `${Date.now() - startTime}ms`,
		})

		if (result === null) return null

		return transformAndValidate(User, result)
	},
} as const)
