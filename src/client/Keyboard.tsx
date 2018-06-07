import * as React from 'react'
import {connect} from 'react-redux';
import './Keyboard.css'

const pianoKeys = Object.freeze({
    'C4': {color: 'white', keyboardKey: 'a'},
    'C#4': {color: 'black', keyboardKey: 'w'},
    'D4': {color: 'white', keyboardKey: 's'},
    'D#4': {color: 'black', keyboardKey: 'e'},
    'E4': {color: 'white', keyboardKey: 'd'},
    'F4': {color: 'white', keyboardKey: 'f'},
    'F#4': {color: 'black', keyboardKey: 't'},
    'G4': {color: 'white', keyboardKey: 'g'},
    'G#4': {color: 'black', keyboardKey: 'y'},
    'A4': {color: 'white', keyboardKey: 'h'},
    'A#4': {color: 'black', keyboardKey: 'u'},
    'B4': {color: 'white', keyboardKey: 'j'},
    // 'C5': {color: 'white', keyboardKey: 'k'},
    // 'C#5': {color: 'black', keyboardKey: 'o'},
    // 'D5': {color: 'white', keyboardKey: 'l'},
    // 'D#5': {color: 'black', keyboardKey: 'p'},
    // 'E5': {color: 'white', keyboardKey: ';'},
})

export const Keyboard = ({pressedKeys}) => (
    <div id="keyboard">
        {Object.keys(pianoKeys).map(key => {
            const isKeyPressed = pressedKeys[pianoKeys[key].keyboardKey]
            const keyPressedClass = isKeyPressed ? 'pressed' : ''
            return (
                <span
                    key={key}
                    className={pianoKeys[key].color + ' ' + keyPressedClass}
                >
                    {key}
                </span>
            )
        })}
    </div>
)

const mapStateToProps = (state) => ({
    pressedKeys: state.keys
})

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)

