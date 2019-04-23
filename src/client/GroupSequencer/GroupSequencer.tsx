import React from 'react'
import {Dispatch} from 'redux'
import {GroupSequencer, selectGroupSequencer, shamuConnect} from '../../common/redux'
import {Panel} from '../Panel/Panel'
import './GroupSequencer.less'

interface Props {
	id: string
}

interface ReduxProps {
	groupSequencer: GroupSequencer
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export function GroupSequencerView(props: AllProps) {
	return (
		<Panel
			label={props.groupSequencer.name}
			className="groupSequencer"
		>
			{props.groupSequencer.groups.map((group, id) => {
				return (
					<div key={id} className="groupRow">
						{group.events.map((event, i) => {
							return (
								<div key={i} className="groupEvent"></div>
							)
						})}
					</div>
				)
			}).toList()}
		</Panel>
	)
}

export const ConnectedGroupSequencerView = shamuConnect(
	(state, {id}: Props): ReduxProps => {
		return {
			groupSequencer: selectGroupSequencer(state.room, id),
		}
	},
)(GroupSequencerView)
