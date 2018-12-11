import {maxUsernameLength} from '../common/redux/clients-redux'

export const saveUsernameToLocalStorage = (name: string) =>
	window.localStorage.setItem('username', name.substring(0, maxUsernameLength).trim())

export const getUsernameFromLocalStorage = () =>
	(window.localStorage.getItem('username') || '') &&
	window.localStorage
		.getItem('username')
		.substring(0, maxUsernameLength)
		.trim()
