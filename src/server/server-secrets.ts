import * as fs from 'fs'
import {isLocalDevServer} from './is-prod-server'

let cachedSecrets: ServerSecrets | undefined

export async function getServerSecrets(): Promise<ServerSecrets> {
	return new Promise(resolve => {
		if (cachedSecrets) return resolve(cachedSecrets)

		const corgiSecretsPath = isLocalDevServer()
			? __dirname + '/corgiSecrets.json'
			: '~/corgiSecrets.json'

		fs.readFile(corgiSecretsPath, 'utf-8', (err, data) => {
			if (err) throw err
			const secrets = JSON.parse(data)
			if (!isServerSecrets(secrets)) {
				throw new Error('parsed server secrets is not a proper ServerSecrets: keys: '
					+ JSON.stringify(Object.keys(secrets)))
			} else {
				cachedSecrets = secrets
				return resolve(cachedSecrets)
			}
		})
	})
}

export interface ServerSecrets {
}

function isServerSecrets(arg: any): arg is ServerSecrets {
	return arg
}
