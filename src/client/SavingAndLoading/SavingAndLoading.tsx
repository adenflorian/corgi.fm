import {stripIndents} from 'common-tags'
import {Map} from 'immutable'
import React from 'react'
import {Fragment} from 'react'
import {Dispatch} from 'redux'
import {loadRoom} from '../../common/redux'
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
			<div className="modalSectionSubLabel">select a saved room to load into a new room</div>
			<div className="modalSectionSubLabel">will be able to load from a file soon...</div>
			<div className="saves">
				{saves.count() === 0 &&
					<div className="noSaves">no saves found</div>
				}
				{saves.count() > 0 &&
					saves.map((saveData, saveId) => {
						const saveName = `${saveData.saveDateTime} - ${saveData.room} - v${saveData.saveClientVersion || '?'}`
						return (
							<div key={saveId} className="localSave">
								<div className="loadSave">
									<Button
										style="flatButton"
										buttonProps={{
											onClick: () => dispatch(loadRoom(saveData)),
										}}
									>
										{saveName}
									</Button>
								</div>
								<div className="deleteSave">
									<Button
										style="flatButton"
										buttonProps={{
											onClick: () => {
												if (window.confirm(stripIndents`Are you sure you want to delete this save?
													${saveName}
													This cannot be undone.`)) {
														dispatch(localActions.deleteSavedRoom(saveId))
														setSaveStorage(getOrCreateLocalSavesStorage())
												}
											},
											title: 'this cannot be undone',
										}}
									>
										Delete
								</Button>
								</div>
							</div>
						)
					}).toList()
				}
			</div>
		</div>
	)
}
