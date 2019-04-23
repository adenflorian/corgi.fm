import React from 'react'
import {Dispatch} from 'redux'
import {shamuConnect} from '../../common/redux'
import {Panel} from '../Panel/Panel'

interface Props {
	id: string
}

interface ReduxProps {

}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export function GroupSequencer(props: AllProps) {
	return (
		<Panel>
			<div className="groupSequencer">coming soon™</div>
		</Panel>
	)
}

export const ConnectedGroupSequencer = shamuConnect(
	(state, {id}: Props): ReduxProps => {
		return {

		}
	},
)(GroupSequencer)
