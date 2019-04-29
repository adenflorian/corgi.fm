import * as React from 'react'
import {Fragment} from 'react'
import {AppOptions, LineType, roomSettingsActions, selectRoomSettings} from '../../common/redux'
import {Button} from '../Button/Button'
import {ConnectedOption} from '../Option'
import {ShamuBorder} from '../Panel/Panel'
import {ConnectedOptionCheckbox} from '../RoomSetting'
import './Options.less'

export class Options extends React.Component {
	public state = {
		showOptions: false,
	}

	public componentDidMount() {
		window.addEventListener('keydown', this._onKeyDown)
	}

	public componentWillUnmount() {
		window.removeEventListener('keydown', this._onKeyDown)
	}

	public render() {
		return (
			<Fragment>
				<Button
					buttonProps={{onClick: () => this.setState({showOptions: !this.state.showOptions})}}
				>
					Options
				</Button>
				{this.state.showOptions &&
					<div className="optionsBG" onClick={() => this._hideOptions()}>
						<div className="optionsPanel" onClick={e => e.stopPropagation()}>
							<div className="optionsPanelInner" >
								<div className="optionsSection localOptions">
									<div className="optionsSectionLabel">Local Options</div>
									<div className="optionsSectionSubLabel">won't affect anyone else</div>
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
								<div className="optionsSection roomOptions">
									<div className="optionsSectionLabel">Room Options</div>
									<div className="optionsSectionSubLabel">other people in this room will see these changes</div>
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
								</div>
							</div>
							<ShamuBorder saturate={false} />
						</div>
					</div>
				}
			</Fragment>
		)
	}

	private readonly _onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.state.showOptions) {
			this._hideOptions()
		}
	}

	private readonly _hideOptions = () => this.setState({showOptions: false})
}
