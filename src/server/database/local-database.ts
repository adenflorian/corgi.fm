import {logger} from '../../common/logger'

export function connectToLocalDB(dbName: string) {
	logger.log('using local DB')
	return Promise.resolve(`mongodb://127.0.0.1:27017/${dbName}`)
}
