import * as React from 'react'
import {Component} from 'react'
import AutosizeInput from 'react-input-autosize'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {chatSubmit, IChatMessage, selectAllMessages} from '../common/redux/chat-redux'
import {selectLocalClient, setClientName} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import './Chat.less'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
	username: string
}

interface IChatProps {
	author?: string
	authorColor?: string
	authorId?: string
	dispatch?: Dispatch
	messages?: IChatMessage[]
}

export class Chat extends Component<IChatProps, IChatComponentState> {
	public static defaultProps = {
		messages: [],
	}

	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
		username: '',
	}

	public chatInputRef: React.RefObject<HTMLInputElement>
	public chatRef: React.RefObject<HTMLDivElement>

	constructor(props: IChatProps) {
		super(props)
		this.chatInputRef = React.createRef()
		this.chatRef = React.createRef()
		this.state.username = props.author
	}

	public componentDidMount = () => window.addEventListener('keydown', this._onKeydown)

	public componentWillUnmount = () => window.removeEventListener('keydown', this._onKeydown)

	public render() {
		const {authorColor, messages} = this.props

		return (
			<div
				id="chat"
				ref={this.chatRef}
				className={this.state.isChatFocused ? 'focused' : ''}
				onFocus={this._onFocus}
				onBlur={this._onBlur}
			>
				<div
					id="chatVerticalGradient"
					className="chatGradient"
				/>
				<div
					id="chatHorizontalGradient"
					className="chatGradient"
				/>
				<ul id="chatMessages">
					{messages.map((x, i) =>
						<li
							key={i}
						>
							<div className="selectable" tabIndex={-1}>
								<span className="author" style={{color: x.color}}>
									{x.authorName}
								</span>
								<span className="text" >
									{x.text}
								</span>
							</div>
						</li>,
					)}
				</ul>
				<div className="chatBottom" style={{textAlign: 'initial'}} tabIndex={-1}>
					<div className="inputWrapper" style={{color: authorColor}} tabIndex={-1}>
						<form className="nameForm" onSubmit={this._onSubmitNameChange}>
							<AutosizeInput
								name="nameAutosizeInput"
								className="author"
								value={this.state.username}
								onChange={this._onNameInputChange}
								autoComplete="off"
								style={{color: authorColor}}
							/>
						</form>
						<form className="chatMessageForm" onSubmit={this._onSubmitChat}>
							<input
								id="chatInput"
								type="text"
								ref={this.chatInputRef}
								onChange={this._onInputChange}
								value={this.state.chatMessage}
								autoComplete="off"
							/>
						</form>
					</div>
				</div>
			</div>
		)
	}

	private _onKeydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key === 'Enter' && this.state.isChatFocused === false) {
			this.chatInputRef.current.focus()
			e.preventDefault()
		}
		if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
	}

	private _onBlur = () => this.setState({isChatFocused: false})

	private _onFocus = () => this.setState({isChatFocused: true})

	private _onNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		this.setState({username: newValue})

		if (newValue === '') return

		this.props.dispatch(setClientName(this.props.authorId, newValue))
	}

	private _onSubmitNameChange = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.username === '') return

		this.props.dispatch(setClientName(this.props.authorId, this.state.username))

		return (document.activeElement as HTMLElement).blur()
	}

	private _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({chatMessage: e.target.value})

	private _onSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.chatMessage !== '') {
			this.props.dispatch(chatSubmit({
				authorName: this.props.author,
				text: this.state.chatMessage,
				color: this.props.authorColor,
			}))

			this.setState({chatMessage: ''})
		}

		return (document.activeElement as HTMLElement).blur()
	}
}

export const ConnectedChat = connect((state: IAppState) => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	authorId: selectLocalClient(state).id,
	messages: selectAllMessages(state),
}))(Chat)
