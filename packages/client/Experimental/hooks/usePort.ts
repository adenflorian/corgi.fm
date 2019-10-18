import {useNodeManagerContext} from '../NodeManager'

export function usePort(nodeId: Id, portId: Id) {
	const nodeManagerContext = useNodeManagerContext()

	return nodeManagerContext.ports.get(nodeId, portId)
}
