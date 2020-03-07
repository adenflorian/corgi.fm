import * as Discord from 'discord.js'
import {logger} from '@corgifm/common/logger';
import {getServerSecrets} from './server-secrets';
import {Store, AnyAction} from 'redux';
import {IServerState, selectClientCount} from '@corgifm/common/redux';

export class DiscordBot {
	private _intervalId?: NodeJS.Timeout
	private _lastClientCount = 0
	private _client?: Discord.Client

	constructor(
		private readonly _store: Store<IServerState, AnyAction>,
	) {}

	public async start() {
		logger.log(`starting discord bot`)

		this._client = new Discord.Client({

		})

		/**
		 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
		 * received from Discord
		 */
		this._client.on('ready', () => {
			logger.log('I am ready!')
		})

		const secrets = await getServerSecrets()

		await this._client.login(secrets.discordClientSecret)

		if (this._client.user) {
			this._client.user.setActivity('hello world!')
		}

		this._startLoop()
	}

	private _startLoop() {
		this._intervalId = setInterval(this._onInterval, 60 * 1000)
	}

	private readonly _onInterval = () => {
		const clientCount = selectClientCount(this._store.getState())
		if (clientCount !== this._lastClientCount) {
			this._lastClientCount = clientCount
			if (this._client && this._client.user) {
				this._client.user.setActivity(clientCount + ' users', {type: 'LISTENING'})
			}
		}
	}

	public dispose() {
		if (this._intervalId) clearInterval(this._intervalId)
		if (this._client) this._client.destroy()
	}
}