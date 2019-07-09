import * as fs from 'fs'

let cachedSecrets: ServerSecrets | undefined

export async function getServerSecrets(): Promise<ServerSecrets> {
	return new Promise(resolve => {
		if (cachedSecrets) return resolve(cachedSecrets)

		fs.readFile('~/corgiSecrets.json', 'utf-8', (err, data) => {
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
	jwtSecret: string
}

function isServerSecrets(arg: any): arg is ServerSecrets {
	return arg && arg.jwtSecret && typeof arg.jwtSecret === 'string'
}
