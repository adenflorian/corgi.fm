import {Length, IsAlphanumeric, IsOptional, Matches} from 'class-validator'
import {colorRegex} from '../common-utils'
import {maxUsernameLength, minUsernameLength} from '../redux'

export class UserUpdate {
	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName: string = ''

	@Matches(colorRegex)
	public readonly color: string = ''
}

export class User extends UserUpdate {
	@IsOptional()
	@Length(28, 28)
	@IsAlphanumeric()
	/** Example: ca5Ck2RLp7TlwLzH4r2ivWTcu1C2 */
	public readonly uid: Id = ''
}

export function makeUser(user: User) {
	return user
}
