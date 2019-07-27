import {Length, IsAlphanumeric, IsOptional, Matches} from 'class-validator'
import {maxUsernameLength, minUsernameLength} from '../redux'

export class UserUpdate {
	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName: string = ''

	@Matches(/#[0-9A-F]{6}/)
	public readonly color: string = ''
}

export class User extends UserUpdate {
	@IsOptional()
	@Length(28, 28)
	@IsAlphanumeric()
	/** Example: ca5Ck2RLp7TlwLzH4r2ivWTcu1C2 */
	public readonly uid: string = ''
}

export function makeUser(user: User) {
	return user
}
