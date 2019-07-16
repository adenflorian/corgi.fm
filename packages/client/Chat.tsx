import React, {Component} from 'react'
import AutosizeInput from 'react-input-autosize'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	selectClientInfo, selectLocalClient, IClientAppState, chatSubmit,
} from '@corgifm/common/redux'
import './Chat.less'
import {ConnectedChatMessages} from './Chat/ChatMessages'
import {isTestClient} from './is-prod-client'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
}

interface ReduxProps {
	author: string
	authorColor: string
	clientVersion: string
	serverVersion: string
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export class Chat extends Component<AllProps, IChatComponentState> {
	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
	}

	public chatInputRef?: HTMLInputElement
	public chatRef: React.RefObject<HTMLDivElement>

	constructor(props: AllProps) {
		super(props)
		this.chatRef = React.createRef()
	}

	public componentDidMount = () => window.addEventListener('keydown', this._onKeydown)

	public componentWillUnmount = () => window.removeEventListener('keydown', this._onKeydown)

	public render() {
		const {authorColor} = this.props

		return (
			<div
				id="chat"
				ref={this.chatRef}
				className={this.state.isChatFocused ? 'focused' : ''}
				onFocus={this._onFocus}
				onBlur={this._onBlur}
			>
				<div
					className="chatOverlay"
				/>

				<ConnectedChatMessages />

				<div className="chatBottom" style={{textAlign: 'initial'}} tabIndex={-1}>
					<div className="inputWrapper" style={{color: authorColor}} tabIndex={-1}>
						<form className="chatMessageForm" onSubmit={this._onSubmitChat} title="Chat box input">
							<AutosizeInput
								id="chatInput"
								onChange={this._onInputChange}
								value={this.state.chatMessage}
								autoComplete="off"
								placeholder="Hit enter to begin a message..."
								inputRef={ref => (this.chatInputRef = ref || undefined)}
							/>
						</form>
						<BottomInfo
							clientVersion={this.props.clientVersion}
							serverVersion={this.props.serverVersion}
						/>
					</div>
				</div>
			</div>
		)
	}

	private readonly _onKeydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key === 'Enter' && this.state.isChatFocused === false && this.chatInputRef) {
			if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input') return
			this.chatInputRef.focus()
			e.preventDefault()
		}
		if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
	}

	private readonly _onBlur = () => this.setState({isChatFocused: false})

	private readonly _onFocus = () => this.setState({isChatFocused: true})

	// Chat
	private readonly _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		this.setState({chatMessage: e.target.value})

	private readonly _onSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.chatMessage !== '') {
			this.props.dispatch(chatSubmit({
				authorName: this.props.author,
				text: this.state.chatMessage,
				color: this.props.authorColor,
			}))

			this.setState({chatMessage: ''})

			// Don't blur if a message was sent, so user can easily send another message
			return
		}

		return (document.activeElement as HTMLElement).blur()
	}
}

interface BottomInfoProps {
	clientVersion: string
	serverVersion: string
}

const BottomInfo = React.memo(function _BottomInfo(props: BottomInfoProps) {
	const isVersionMismatch = props.clientVersion !== props.serverVersion

	return (
		<div className="bottomInfo">
			{/* <div className="info-env">{getEnvDisplayName()}</div> */}
			<div
				className={`info-corgi ${isTestClient() ? 'info-corgiTest' : ''}`}
			>
				{`${isTestClient() ? 'test.' : ''}corgi.fm`}
			</div>
			<div
				className="info-milestone"
			>
				pre-alpha
			</div>
			<div
				className={`info-version ${isVersionMismatch ? 'info-versionMismatch' : ''}`}
				title={isVersionMismatch
					? `Client is out of date, click to reload\nServer version: ${props.serverVersion}`
					: 'Up to date!'
				}
				style={{
					cursor: isVersionMismatch ? 'pointer' : 'inherit',
				}}
				onClick={isVersionMismatch
					? () => window.location.reload()
					: undefined
				}
			>
				{`v${props.clientVersion}`}
			</div>
		</div>
	)
})

export const ConnectedChat = connect((state: IClientAppState): ReduxProps => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	clientVersion: selectClientInfo(state).clientVersion,
	serverVersion: selectClientInfo(state).serverVersion,
}))(Chat)
