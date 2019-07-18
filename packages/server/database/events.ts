import {Db} from 'mongodb'
import {logger} from '@corgifm/common/logger'

const eventsCollectionName = 'events'

export const eventsQueries = (db: Db) => ({
	async saveUserConnectEventAsync(event: UserConnectedEvent) {
		const startTime = Date.now()
		logger.log('saveUserConnectEvent: ', {event})
		const result = await db.collection(eventsCollectionName).insertOne(event)
		logger.log('saveUserConnectEvent result: ', {insertedCount: result.insertedCount, time: `${Date.now() - startTime}ms`})
		return result.insertedCount
	},
} as const)

interface UserConnectedEvent {
	username: string
	room: string
	time: Date
}
