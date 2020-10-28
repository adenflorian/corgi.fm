import {useNodeManagerContext} from '../NodeManager'

export function usePort(nodeId: Id, portId: Id) {
	const nodeManagerContext = useNodeManagerContext()

	return nodeManagerContext.ports.get(nodeId, portId)
}

export function useConnection(id: Id) {
	const nodeManagerContext = useNodeManagerContext()

	return nodeManagerContext.connections.get(id)
}
