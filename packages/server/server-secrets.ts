import * as fs from 'fs'
import * as os from 'os'
import {plainToClass} from 'class-transformer'
import {Length, validate} from 'class-validator'
import {isLocalDevServer} from './is-prod-server'

let cachedSecrets: ServerSecrets | undefined

export async function loadServerSecrets() {
	if (cachedSecrets) return

	const corgiSecretsPath = isLocalDevServer()
		? __dirname + '/../../corgiSecrets.json'
		: os.homedir() + '/corgiSecrets.json'

	const buffer = await fs.promises.readFile(corgiSecretsPath, {encoding: 'utf8'})

	const secrets = plainToClass(ServerSecrets, JSON.parse(buffer))

	const errors = await validate(secrets, {
		validationError: {
			target: false,
			value: true,
		},
		forbidUnknownValues: true,
		whitelist: true,
	})

	if (errors.length === 0) {
		cachedSecrets = secrets
	} else {
		throw new Error('parsed server secrets is not a proper ServerSecrets: keys: ' + JSON.stringify({corgiSecretsPath, buffer, errors, secrets: Object.keys(secrets)}))
	}
}

export function getServerSecrets(): ServerSecrets {
	if (!cachedSecrets) throw new Error('must load secrets first!')

	return cachedSecrets
}

export class ServerSecrets {
	@Length(1)
	public readonly discordClientSecret: string = ''
}
