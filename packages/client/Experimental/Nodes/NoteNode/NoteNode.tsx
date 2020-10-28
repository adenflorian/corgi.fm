import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomStringParam, ExpCustomStringParams, ExpCustomStringParamReadonly} from '../../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {NoteNodeView} from './NoteNodeView'

export class NoteNode extends CorgiNode {
	protected readonly _customStringParams: ExpCustomStringParams
	private readonly _text: ExpCustomStringParam
	public get text() {return this._text as ExpCustomStringParamReadonly}

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Note', color: CssColor.yellow, renderDebugStuff: false})

		this._text = new ExpCustomStringParam('note', '', false)
		this._customStringParams = arrayToESIdKeyMap([this._text] as ExpCustomStringParam[])
	}

	public render = () => this.getDebugView(<NoteNodeView />)

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {}
}
