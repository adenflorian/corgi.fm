import ReactDOM from 'react-dom'
import * as immutable from 'immutable'
import {ExpNodeState, ExpConnection} from '@corgifm/common/redux'
import {getExpAnchorId} from '../SimpleGraph/SimpleGraphNode'
import {logger} from '../client-logger'
import {ParamChange, CorgiNode, typeClassMap, ExpNodeConnection} from './ExpNodes'

export class NodeManager {
	private readonly _nodes = new Map<Id, CorgiNode>()
	private readonly _connections = new Map<Id, ExpNodeConnection>()

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

				logger.log('goo goo:', {targetId, targetContainerElement})

				ReactDOM.render(
					node.render(),
					targetContainerElement
				)
			}, 1)
		})
	}

	public onNodeParamChange = (paramChange: ParamChange) => {
		const node = this._nodes.get(paramChange.targetNodeId)

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

	public addConnections = (connections: immutable.Map<Id, ExpConnection>) => {
		connections.valueSeq().toList().forEach(this.connectAudioNodes)
		// TODO More stuff
	}

	public connectAudioNodes = (expConnection: ExpConnection) => {
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
		const connection = new ExpNodeConnection(expConnection.id, sourcePort, targetPort)
		this._connections.set(connection.id, connection)

		// Connect ports to connection
		sourcePort.connect(connection)
		targetPort.connect(connection)

		// Connect connection to ports
		connection.connectSource(sourcePort)
		connection.connectTarget(targetPort)

		// Notify nodes of new connection
		if (targetPort.destination instanceof AudioParam) {
			sourcePort.source.connect(targetPort.destination)
		} else {
			sourcePort.source.connect(targetPort.destination)
		}
	}

	public cleanup() {
		this._nodes.forEach(node => {
			node.dispose()
		})
		this._nodes.clear()
		this._connections.clear()
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API
