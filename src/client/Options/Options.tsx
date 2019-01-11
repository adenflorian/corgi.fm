import * as React from 'react'
import {Fragment} from 'react'
import {Button} from '../Button/Button'
import {ConnectedOption} from '../Option'
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
							<ConnectedOption
								option={'showNoteNamesOnKeyboard'}
								label="show names on keyboard"
							/>
						</div>
					</div>
				}
			</Fragment>
		)
	}

	private _onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.state.showOptions) {
			this._hideOptions()
		}
	}

	private _hideOptions = () => this.setState({showOptions: false})
}
