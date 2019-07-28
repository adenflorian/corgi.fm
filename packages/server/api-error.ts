import {logger} from '@corgifm/common/logger'
import {CorgiValidationError} from '@corgifm/common/validation'
import {ErrorRequestHandler} from 'express'

export const handleError: ErrorRequestHandler = async (
	error, req, res, next
) => {
	if (res.headersSent) {
		return next(error)
	} else if (error instanceof CorgiValidationError) {
		return res.status(400).json({
			validationError: error.validationError,
		})
	} else if (error instanceof CorgiBadRequestError) {
		return res.status(400).json({
			message: error.message,
		})
	} else if (error instanceof CorgiMethodNotAllowedError) {
		return res.status(405).json({})
	} else {
		// @ts-ignore
		const errorCode = res.sentry

		logger.error('unhandled api error: ', {error, errorCode})

		return res
			.status(error.statusCode || error.status || 500)
			.json({
				message: `something borked, here is an error code `
					+ `that the support people might `
					+ `find useful: ${errorCode}`,
			})
	}
}

/** Message will be displayed to user */
export class CorgiBadRequestError extends Error {
}

/** Message will be displayed to user */
export class CorgiMethodNotAllowedError extends Error {
}
