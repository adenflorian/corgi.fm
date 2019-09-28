import ReactDOM from 'react-dom'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import {getExpAnchorId} from '../SimpleGraph/SimpleGraphNodeExp'
import {CorgiNode, typeClassMap} from './ExpNodes'
import {ParamChange, ExpNodeAudioConnection} from './ExpTypes'

export class NodeManager {
	private readonly _nodes = new Map<Id, CorgiNode>()
	// private readonly _connections = new Map<Id, ExpNodeConnection>()
	private readonly _audioConnections = new Map<Id, ExpNodeAudioConnection>()

	public constructor(
		private readonly _audioContext: AudioContext
	) {}

	public renderAll = () => {
		[...this._nodes.values()].forEach(node => {
			node.render()

			// Using a timeout so that react-redux can render the containers
			setTimeout(() => {
				const targetId = getExpAnchorId(node.id)
				const targetContainerElement = document.getElementById(targetId)

				ReactDOM.render(
					node.render(),
					targetContainerElement
				)
			}, 1)
		})
	}

	public onNodeParamChange = (paramChange: ParamChange) => {
		const node = this._nodes.get(paramChange.nodeId)

		if (node) {
			node.onParamChange(paramChange)
		} else {
			// warning/error
		}
	}

	public addNode = (newNode: CorgiNode) => {
		this._nodes.set(newNode.id, newNode)
		// TODO More stuff
	}

	public addNodes = (newNodes: immutable.Map<Id, ExpNodeState>) => {
		newNodes.forEach(node => {
			this._nodes.set(node.id, new typeClassMap[node.type](node.id, this._audioContext))
		})
		this.renderAll()
		// TODO More stuff
	}

	public addAudioConnections = (connections: immutable.Map<Id, IExpConnection>) => {
		connections.valueSeq().toList().forEach(this.addAudioConnection)
		// TODO More stuff
	}

	public addAudioConnection = (expConnection: IExpConnection) => {
		// Get nodes
		const source = this._nodes.get(expConnection.sourceId)
		const target = this._nodes.get(expConnection.targetId)
		if (!source || !target) {
			logger.warn('uh oh: ', {source, target})
			return
		}

		// Get and connect ports
		const sourcePort = source.getAudioOutputPort(expConnection.sourcePort)
		const targetPort = target.getAudioInputPort(expConnection.targetPort)
		if (!sourcePort || !targetPort) return logger.warn('404 port not found: ', {sourcePort, targetPort})

		// Create connection
		const connection = new ExpNodeAudioConnection(expConnection.id, sourcePort, targetPort)
		this._audioConnections.set(connection.id, connection)
	}

	public deleteAudioConnection = (connectionId: Id) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('tried to delete non existent connection: ', connectionId)

		this._audioConnections.delete(connectionId)

		connection.dispose()
	}

	public deleteAllAudioConnections = () => {
		this._audioConnections.forEach(x => this.deleteAudioConnection(x.id))
	}

	public changeAudioConnectionSource = (connectionId: Id, newSourceId: Id, newSourcePort: number) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const source = this._nodes.get(newSourceId)
		if (!source) return logger.warn('uh oh: ', {source})

		// Get and connect ports
		const sourcePort = source.getAudioOutputPort(newSourcePort)
		if (!sourcePort) return logger.warn('404 port not found: ', {sourcePort})

		// Disconnect old source
		connection.changeSource(sourcePort)
	}

	public changeAudioConnectionTarget = (connectionId: Id, newTargetId: Id, newTargetPort: number) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const target = this._nodes.get(newTargetId)
		if (!target) return logger.warn('uh oh: ', {target})

		// Get and connect ports
		const targetPort = target.getAudioInputPort(newTargetPort)
		if (!targetPort) return logger.warn('404 port not found: ', {targetPort})

		// Disconnect old target
		connection.changeTarget(targetPort)
	}

	public cleanup = () => {
		this._nodes.forEach(node => {
			node.dispose()
		})
		this._nodes.clear()
		this._audioConnections.clear()
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API
