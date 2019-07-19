import {Length} from 'class-validator'
import {maxUsernameLength, minUsernameLength} from '../redux'

export class User {
	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName?: string
}
