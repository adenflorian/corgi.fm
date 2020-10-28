import React, {useCallback} from 'react'
import {ExpButton} from './ExpParams'

interface Props {
	nodeId: Id
	button: ExpButton
}

export const ExpNodeDebugButton = React.memo(function _ExpNodeDebugButton({
	nodeId, button,
}: Props) {

	const onClick = useCallback(() => {
		button.press()
	}, [button])

	return (
		<div style={{margin: 8}}>
			<button className="bg-dark corgiButton" onClick={onClick}>
				{button.id}
			</button>
		</div>
	)
})
