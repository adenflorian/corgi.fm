// import {
// 	useLayoutEffect, useState, useRef,
// } from 'react'
// import {useNodeContext} from '../CorgiNode'

// export type UseAudioPAramInputsUpdate = 

// export function useAudioParamInputs(paramId: Id) {
// 	const nodeContext = useNodeContext()

// 	const [value, setState] = useState(0)

// 	const previousValue = useRef(0)

// 	useLayoutEffect(() => {
// 		function onNewValue(newValue: number) {
// 			if (newValue === previousValue.current) {
// 				return
// 			}

// 			previousValue.current = newValue
// 			setState(newValue)
// 		}

// 		nodeContext.registerAudioParam(paramId, onNewValue)

// 		return () => nodeContext.unregisterAudioParam(paramId, onNewValue)
// 	}, [nodeContext, paramId])

// 	return value
// }
