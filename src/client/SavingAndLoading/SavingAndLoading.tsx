import {stripIndents} from 'common-tags'
import {Map} from 'immutable'
import moment from 'moment'
import {Fragment} from 'react'
import React from 'react'
import {Dispatch} from 'redux'
import {loadRoom, SavedRoom} from '../../common/redux'
import {Button} from '../Button/Button'
import {getOrCreateLocalSavesStorage, localActions} from '../local-middleware'
import {Modal} from '../Modal/Modal'
import './SavingAndLoading.less'

export const SavingAndLoading = React.memo(function _SavingAndLoading({dispatch}: {dispatch: Dispatch}) {
	const [visible, setVisible] = React.useState(false)

	return (
		<Fragment>
			<Button
				buttonProps={{onClick: () => setVisible(!visible)}}
			>
				Load Room
			</Button>
			{visible &&
				<Modal
					onHide={() => setVisible(false)}
					className="loadRoomUI"
				>
					<LoadRoomModalInner
						dispatch={dispatch}
					/>
				</Modal>
			}
		</Fragment>
	)
})

function LoadRoomModalInner({dispatch}: {dispatch: Dispatch}) {
	const [saveStorage, setSaveStorage] = React.useState(getOrCreateLocalSavesStorage())

	const saves = Map(saveStorage.all)

	return (
		<div className="modalSection localSaves">
			<div className="modalSectionLabel">Load Room</div>
			<div className="modalSectionSubLabel">select a saved room to load into a new room<br />will be able to load from a file soon...</div>
			<div className="modalSectionContent saves">
				{saves.count() === 0 &&
					<div className="noSaves">no saves found</div>
				}
				{saves.count() > 0 &&
					saves.sort(savedRoomComparator).map((saveData, saveId) => {
						const saveName = `${saveData.saveDateTime} - ${saveData.room} - v${saveData.saveClientVersion || '?'}`
						const version = saveData.saveClientVersion || '?'
						const date = moment(saveData.saveDateTime).calendar()
						const onClick = () => dispatch(loadRoom(saveData))
						return (
							<div key={saveId} className="localSave">
								<div className="load">
									<div className="room" title={`Load ${saveData.room}`} onClick={onClick}>{saveData.room}</div>
									<div className="date" title={date} onClick={onClick}>{date}</div>
									<div className="version" title={`Version ${version}`} onClick={onClick}>{version}</div>
								</div>
								<div
									className="delete"
									onClick={() => {
										if (window.confirm(stripIndents`Are you sure you want to delete this save?
											${saveName}
											This cannot be undone.`)
										) {
											dispatch(localActions.deleteSavedRoom(saveId))
											setSaveStorage(getOrCreateLocalSavesStorage())
										}
									}}
									title="This cannot be undone"
								>
									<span>Delete</span>
								</div>
							</div>
						)
					}).toList()
				}
			</div>
		</div>
	)
}

function savedRoomComparator(a: SavedRoom, b: SavedRoom): number {
	return -a.saveDateTime.localeCompare(b.saveDateTime)
}
