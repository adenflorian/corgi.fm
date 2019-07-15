import React from 'react'
import {Fragment} from 'react'
import {
	AppOptions, LineType, roomSettingsActions, selectLocalClientId,
	selectRoomSettings, shamuConnect,
} from '../../common/redux'
import {Button} from '../Button/Button'
import {Modal} from '../Modal/Modal'
import {ConnectedOption} from '../Option'
import {ConnectedOptionCheckbox} from '../RoomSetting'
import './Options.less'

interface ReduxProps {
	isLocalClientRoomOwner: boolean
	onlyOwnerCanDoStuff: boolean
}

export const Options = ({isLocalClientRoomOwner, onlyOwnerCanDoStuff}: ReduxProps) => {
	const [visible, setVisible] = React.useState(false)

	return (
		<Fragment>
			<Button
				onClick={() => setVisible(!visible)}
			>
				Options
			</Button>
			{visible &&
				<Modal
					onHide={() => setVisible(false)}
					className="options"
				>
					<div className="modalSection localOptions">
						<div className="modalSectionLabel">Local Options</div>
						<div className="modalSectionSubLabel">won't affect anyone else</div>
						<div className="modalSectionContent">
							<ConnectedOption
								option={AppOptions.showNoteNamesOnKeyboard}
								label="show note names on keyboard"
							/>
							<ConnectedOption
								option={AppOptions.requireCtrlToScroll}
								label="require control key to zoom (might be needed by laptop users)"
							/>
							<ConnectedOption
								option={AppOptions.showNoteSchedulerDebug}
								label="note scheduler debug: enable"
							/>
							<ConnectedOption
								option={AppOptions.renderNoteSchedulerDebugWhileStopped}
								label="note scheduler debug: keep rendering even when song is stopped"
							/>
							<ConnectedOption
								option={AppOptions.graphics_fancyConnections}
								label="graphics: enable fancy connections"
							/>
							<ConnectedOption
								option={AppOptions.graphics_ECS}
								label="graphics: enable ECS animations (sequencer time marker thing)"
							/>
							<ConnectedOption
								option={AppOptions.graphics_expensiveZoomPan}
								label="graphics: enable expensive/fancy zoom and pan (sharper render, but slower)"
							/>
						</div>
					</div>
					{!isLocalClientRoomOwner && onlyOwnerCanDoStuff ?
						<div className="modalSection roomOptions">
							<div className="modalSectionLabel">Room Options</div>
							<div className="modalSectionSubLabel">the room owner has locked this room to where only the room owner can change room settings</div>
						</div>
						:
						<div className="modalSection roomOptions">
							<div className="modalSectionLabel">Room Options</div>
							<div className="modalSectionSubLabel">other people in this room will see these changes</div>
							<div className="modalSectionContent">
								<ConnectedOptionCheckbox
									label="straight connection lines"
									onChange={dispatch => e =>
										dispatch(roomSettingsActions.changeLineType(e.target.checked
											? LineType.Straight
											: LineType.Curved,
										))}
									valueSelector={state =>
										selectRoomSettings(state.room).lineType === LineType.Straight
											? true
											: false
									}
								/>
								{isLocalClientRoomOwner &&
									<ConnectedOptionCheckbox
										label="only owner can do stuff"
										onChange={dispatch => e =>
											dispatch(roomSettingsActions.changeOnlyOwnerCanDoStuff(e.target.checked))}
										valueSelector={state => selectRoomSettings(state.room).onlyOwnerCanDoStuff}
									/>
								}
							</div>
						</div>
					}
				</Modal>
			}
		</Fragment>
	)
}

export const ConnectedOptions = shamuConnect(
	(state): ReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			isLocalClientRoomOwner: selectLocalClientId(state) === roomSettings.ownerId,
			onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
		}
	},
)(Options)
