import {connectToLocalDB} from './database/local-database'
import {startInMemoryDB} from './database/memory-database'
import {isLocalDevServer} from './is-prod-server'

export function getDbConnector() {
	return isLocalDevServer()
		? serverConfig.db.local
		: serverConfig.db.prod
}

const serverConfig = Object.freeze({
	db: {
		local: startInMemoryDB,
		prod: connectToLocalDB,
	},
})
