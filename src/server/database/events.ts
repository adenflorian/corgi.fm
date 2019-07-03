import {Db} from 'mongodb'
import {logger} from '../../common/logger'

const eventsCollectionName = 'events'

export const eventsQueries = (db: Db) => Object.freeze({
	async saveUserConnectEventAsync(event: UserConnectedEvent) {
		const startTime = Date.now()
		logger.log('saveUserConnectEvent: ', {event})
		const result = await db.collection(eventsCollectionName).insertOne(event)
		logger.log('saveUserConnectEvent result: ', {insertedCount: result.insertedCount, time: `${Date.now() - startTime}ms`})
		return result
	},
})

interface UserConnectedEvent {
	username: string
	room: string
	time: Date
}
