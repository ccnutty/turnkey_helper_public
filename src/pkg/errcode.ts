
export interface ErrorCode {
	errCode: number;
	errMsg: string;
}

export enum ErrorCodes {
	OK = 0,
	NETWORK_ERROR = 100001,
	INVALID_PARAM_ERROR = 100002,
	SERVER_ERROR = 100003,
	DATA_ERROR = 100004,
	PARAMS_ERROR = 100005,
	TURNKEY_SVR_ERROR = 100006,


	SUB_ORG_NOT_FOUND = 100101,
	SUB_ORG_CREATE_FAILED = 100102,
	OTP_VERIFY_FAILED = 100103,

	
}

export function getErrorCode(errorCode: ErrorCodes): ErrorCode {
	return {
		errCode: errorCode,
		errMsg: ErrorMessages[errorCode],
	};
}

const ErrorMessages: Record<ErrorCodes, string> = {
	[ErrorCodes.OK]: "Success",
	[ErrorCodes.NETWORK_ERROR]: "A network error occurred",
	[ErrorCodes.INVALID_PARAM_ERROR]: "Invalid parms",
	[ErrorCodes.SERVER_ERROR]: "Server error",
	[ErrorCodes.DATA_ERROR]: "Data error",
	[ErrorCodes.PARAMS_ERROR]: "Params error",
	[ErrorCodes.TURNKEY_SVR_ERROR]: "Turnkey server error",
	[ErrorCodes.SUB_ORG_NOT_FOUND]: "Sub org not found",
	[ErrorCodes.SUB_ORG_CREATE_FAILED]: "Sub org create failed",
	[ErrorCodes.OTP_VERIFY_FAILED]: "OTP verify failed",
	
  };

