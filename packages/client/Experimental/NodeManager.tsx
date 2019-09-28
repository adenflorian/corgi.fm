import ReactDOM from 'react-dom'
import * as immutable from 'immutable'
import {ExpNodeState, ExpConnection} from '@corgifm/common/redux'
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

	public addAudioConnections = (connections: immutable.Map<Id, ExpConnection>) => {
		connections.valueSeq().toList().forEach(this.createAudioConnection)
		// TODO More stuff
	}

	public createAudioConnection = (expConnection: ExpConnection) => {
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

		// Connect ports to connection
		sourcePort.connect(connection)
		targetPort.connect(connection)

		// Connect connection to ports
		connection.connectSource(sourcePort)
		connection.connectTarget(targetPort)

		// Connect audio stuff
		if (targetPort.destination instanceof AudioParam) {
			sourcePort.source.connect(targetPort.destination)
		} else {
			sourcePort.source.connect(targetPort.destination)
		}
	}

	public deleteConnection = (id: Id) => {
		const connection = this._audioConnections.get(id)

		if (!connection) return logger.warn('tried to delete non existent connection: ', id)

		this._audioConnections.delete(id)

		// Get and connect ports
		const sourcePort = connection.getSource()
		const targetPort = connection.getTarget()
		if (!sourcePort || !targetPort) return logger.warn('[deleteConnection] 404 port not found: ', {sourcePort, targetPort})

		if (targetPort.destination instanceof AudioParam) {
			sourcePort.source.disconnect(targetPort.destination)
		} else {
			sourcePort.source.disconnect(targetPort.destination)
		}
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
