import {selectAllClients} from '@corgifm/common/redux'
import {validateOrReject} from 'class-validator'
import {User} from '@corgifm/common/models/User'
import {plainToClass} from 'class-transformer'
import * as Router from '@koa/router'
import {Context} from 'koa'
import {ClassType} from 'class-transformer/ClassTransformer'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'

export const usersRouter = (
	serverStore: ServerStore,
	dbStore: DBStore,
): Router => {
	const router = new Router()

	router.get(`/count`, ctx => {
		ctx.body = selectAllClients(serverStore.getState()).length
	})

	router.get('/:userId', ctx => {
		// if missing userId return 400
		// if user not found, return 404
		// if not data for user, return empty object
		// otherwise return data
		ctx.status = 404
		ctx.body = {
			message: `userNotFound`,
		}
	})

	router.put('/:userId', validate(User, putUser))

	return router
}

async function putUser(ctx: Context, user: User) {
	// if missing userId return 400
	// const userId = ctx.params.userId
	// if (!userId) {
	// 	throw new E
	// }

	// if (validateUserId(userId)) {
	// 	userId.
	// 	}
	// if user not found, return 404
	// if not data for user, return empty object
	// otherwise return data
	ctx.status = 501

	ctx.body = {
		user: user.displayName.toUpperCase(),
	}
}

type ValidateCB<T> = (ctx: Context, x: T) => Promise<any>

/** Returns middleware that will transform and validate the request body.
 * Validation errors will cause a rejection that you can handle in higher
 * up middleware. */
function validate<T extends object>(
	targetClass: ClassType<T>, callback: ValidateCB<T>
) {
	return async (ctx: Context): Promise<T> => {
		const transformed = plainToClass(targetClass, ctx.request.body)

		await validateOrRejectCustom(transformed)

		return callback(ctx, transformed)
	}
}

async function validateOrRejectCustom(object: object) {
	await validateOrReject(object, {
		validationError: {
			target: false,
		},
		forbidUnknownValues: true,
	})
}

interface UserId extends String {}

// function validateUserId(arg: any): arg is UserId {
// 	if (arg && typeof arg === 'string') {
// 		return true
// 	} else {
// 		const error = new ValidationError()
// 		error.property = 'userId'
// 		error.value = arg
// 		throw error
// 	}
// }

// function IsUserId(options?: ValidationOptions) {
// 	return (object: object, propertyName: string) => {
// 		registerDecorator({
// 			name: 'isUserId',
// 			target: object.constructor,
// 			propertyName,
// 			constraints: [],
// 			options,
// 			validator: {
// 				validate(value: any, args: ValidationArguments) {
// 					return typeof value === 'string' && value.length > 0
// 				},
// 			},
// 		})
// 	}
// }
