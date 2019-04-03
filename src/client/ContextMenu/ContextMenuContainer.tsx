import React, {MouseEvent, Fragment} from 'react'
import {backgroundMenuId} from '../client-constants';
import {MenuItem, ContextMenu} from 'react-contextmenu';
import './ContextMenu.less'
import {
	shamuConnect, addBasicSynthesizer, BasicSynthesizerState, addPosition,
	makePosition, GridSequencerState, addGridSequencer,
	BasicSamplerState, addBasicSampler,
	InfiniteSequencerState, addInfiniteSequencer,
	SimpleReverbState, addSimpleReverb
} from '../../common/redux';
import {Dispatch, AnyAction} from 'redux';
import {serverClientId} from '../../common/common-constants';
import {Point, IConnectable} from '../../common/common-types';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';

interface AllProps {
	dispatch: Dispatch
}

export function ContextMenuContainer({dispatch}: AllProps) {
	return (
		<ContextMenu id={backgroundMenuId}>
			<MenuItems dispatch={dispatch} />
		</ContextMenu>
	)
}

const MenuItems = React.memo(function _MenuItems({dispatch}: {dispatch: Dispatch}) {

	function AddNodeMenuItem(props: AddNodeMenuItemProps) {
		return (
			<MenuItem onClick={(e) => {
				const newState = new props.stateConstructor(serverClientId)
				dispatch(props.actionCreator(newState))
				createPosition(dispatch, newState, e)
			}}>
				{props.label}
			</MenuItem>
		)
	}

	return (
		<Fragment>
			<MenuItem
				attributes={{
					className: 'contextMenuTop',
					title: 'shift + right click to get browser context menu',
				}}
				preventClose={true}
			>
				do stuff
			</MenuItem>
			<AddNodeMenuItem
				label="Add Synth"
				stateConstructor={BasicSynthesizerState}
				actionCreator={addBasicSynthesizer}
			/>
			<AddNodeMenuItem
				label="Add Piano Sampler"
				stateConstructor={BasicSamplerState}
				actionCreator={addBasicSampler}
			/>
			<AddNodeMenuItem
				label="Add Grid Sequencer"
				stateConstructor={GridSequencerState}
				actionCreator={addGridSequencer}
			/>
			<AddNodeMenuItem
				label="Add Infinite Sequencer"
				stateConstructor={InfiniteSequencerState}
				actionCreator={addInfiniteSequencer}
			/>
			<AddNodeMenuItem
				label="Add R E V E R B"
				stateConstructor={SimpleReverbState}
				actionCreator={addSimpleReverb}
			/>
		</Fragment>
	)
})

interface AddNodeMenuItemProps {
	label: string
	stateConstructor: new (ownerId: string) => IConnectable
	actionCreator: (state: any) => AnyAction
}

function createPosition(dispatch: Dispatch, state: IConnectable, e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) {
	dispatch(addPosition(
		makePosition({
			id: state.id,
			targetType: state.type,
			width: state.width,
			height: state.height,
			...getPositionFromMouseOrTouchEvent(e)
		})
	))
}

function getPositionFromMouseOrTouchEvent(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}

function toGraphSpace(x = 0, y = 0): Readonly<Point> {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return Object.freeze({
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	})
}

export const ConnectedContextMenuContainer = shamuConnect()(ContextMenuContainer)
