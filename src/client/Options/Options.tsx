import * as React from 'react'
import {Fragment} from 'react'
import {AppOptions} from '../../common/redux'
import {Button} from '../Button/Button'
import {ConnectedOption} from '../Option'
import {ShamuBorder} from '../Panel/Panel'
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
