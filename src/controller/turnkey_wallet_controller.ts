import { logger } from '../pkg/log'
import {  ErrorCodes, getErrorCode } from '../pkg/errcode'
import { Request, Response } from 'express';

import * as services from '../services'
import { CreateSubOrgByWalletAuthParams } from '../models/bo'
import * as tkutils from '../tkutils'


// //wallet_AUTH
// export async function apiAddWallet(req: Request, res: Response) {
//     console.log(`getSubOrg params: `, req.body)
//     const {publicKey} = req.body
//     if (!publicKey || publicKey == "" ) {
//         logger.error(`invalid params: ${JSON.stringify(req.body)}`)
//         const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
//         res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
//         return
//     }

//     try {
//         const {organizationId,errcode} = await services.getSubOrgId("PUBLIC_KEY",publicKey)

//         if (errcode.errCode==ErrorCodes.OK) {
//             console.log(`organizationId: `, organizationId)
//             res.json({ data: { "organizationId": organizationId }, errcode: errcode.errCode, errmsg: errcode.errMsg })
//             return
//         }else{
//             const ec = getErrorCode(ErrorCodes.SUB_ORG_NOT_FOUND)
//             res.json({ data: { "organizationId": null }, errcode: ec.errCode, errmsg: ec.errMsg })
//             return
//         }
       
//     } catch (error) {
//         logger.error('Error verifySignature err:', error);
//         // console.error(error.stack);
//         const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
//         res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
//         return
//     }

// }
