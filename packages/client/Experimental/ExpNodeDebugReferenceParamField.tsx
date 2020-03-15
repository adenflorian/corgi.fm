import React from 'react'
import {ExpReferenceParam} from './ExpParams'
import {useObjectChangedEvent} from './hooks/useCorgiEvent'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	nodeId: Id
	referenceParam: ExpReferenceParam
}

export const ExpNodeDebugReferenceParamField = React.memo(function _ExpNodeDebugReferenceParamField({
	nodeId, referenceParam,
}: Props) {
	const value = useObjectChangedEvent(referenceParam.value)

	return (
		<div style={{color: CssColor.defaultGray, fontSize: 12, fontFamily: 'Ubuntu'}}>
			<div>ReferenceParamId: {referenceParam.id}</div>
			<div>TargetId: {value.id}</div>
		</div>
	)
})
