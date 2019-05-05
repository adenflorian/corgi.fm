import {Map} from 'immutable'
import React from 'react'
import {Fragment} from 'react'
import {Button} from '../Button/Button'
import {getOrCreateLocalSavesStorage} from '../local-middleware'
import {Modal} from '../Modal/Modal'
import './SavingAndLoading.less'

export const SavingAndLoading = React.memo(function _SavingAndLoading() {
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
					<LoadRoomModalInner />
				</Modal>
			}
		</Fragment>
	)
})

function LoadRoomModalInner() {
	const [saveStorage, setSaveStorage] = React.useState(getOrCreateLocalSavesStorage())

	const saves = Map(saveStorage.all)

	return (
		<div className="modalSection localSaves">
			<div className="modalSectionLabel">Load Room</div>
			<div className="modalSectionSubLabel">select a saved room to load into the current room</div>
			<div className="modalSectionSubLabel">(will not delete anything currently in this room)</div>
			<div className="saves">
				{saves.count() === 0 &&
					<div className="noSaves">no saves found</div>
				}
				{saves.count() > 0 &&
					saves.map((saveData, saveId) => {
						return (
							<div key={saveId} className="localSave">
								<Button
									key={saveId}
									style="flatButton"
								>
									{saveData.saveDateTime} - {saveData.room}
								</Button>
							</div>
						)
					}).toList()
				}
			</div>
		</div>
	)
}
