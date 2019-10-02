import {
	useLayoutEffect, useState, useRef,
} from 'react'
import {useNodeContext} from '../CorgiNode'

export function useCustomNumberParam(paramId: Id) {
	const nodeContext = useNodeContext()

	const [value, setState] = useState(0)

	const previousValue = useRef(0)

	useLayoutEffect(() => {
		function onNewValue(newValue: number) {
			if (newValue === previousValue.current) {
				return
			}

			previousValue.current = newValue
			setState(newValue)
		}

		nodeContext.registerCustomNumberParam(paramId, onNewValue)

		return () => nodeContext.unregisterCustomNumberParam(paramId, onNewValue)
	}, [nodeContext, paramId])

	return value
}
