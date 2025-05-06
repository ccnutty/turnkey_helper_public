import { logger } from '../pkg/log'
import { ErrorCode, ErrorCodes, getErrorCode } from '../pkg/errcode'
import { Request, Response } from 'express';
import * as services from '../services'
import { OtpType } from '../turnkey_const';


//email AUTH
//https://docs.turnkey.com/api-reference/activities/init-otp-auth
export async function apiGetSubOrgByEmail(req: Request, res: Response) {
    console.log(`getSubOrg params: `, req.body)
    const {email,targetPublicKey} = req.body
    if (!email || email == "" || !targetPublicKey || targetPublicKey == "") {
        logger.error(`invalid params: ${JSON.stringify(req.body)}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    if (email.indexOf("@") == -1) {
        logger.error(`invalid email: ${email}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    try {
        let subOrgId=""
        const {organizationId,errcode} = await services.getSubOrgId("EMAIL",email)
        if (errcode.errCode==ErrorCodes.OK) {
          subOrgId=organizationId
          console.log(`organizationId: `, organizationId)
        }else{
          //create sub org
          const {result,errcode} = await services.createSubOrg({
            email,
          })
          if (errcode.errCode==ErrorCodes.OK) {
            console.log(`create sub org by email success: ${JSON.stringify(result)}`)
            if (result?.subOrganizationId) {
              subOrgId = result?.subOrganizationId
            }
          }else{
              res.json({ data: null, errcode: errcode.errCode, errmsg: errcode.errMsg })
              return 
          }
        }

        if (subOrgId == "") {
          const ec = getErrorCode(ErrorCodes.SUB_ORG_NOT_FOUND)
          res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
          return
        }

        const sr = await services.sendInitOTP(subOrgId,OtpType.Email,email,targetPublicKey)
        if (sr.errcode.errCode==ErrorCodes.OK) {
          res.json({data:{otpId:sr.otpId,organizationId:subOrgId},errcode:sr.errcode.errCode,errmsg:sr.errcode.errMsg})
          return
        }else{
          logger.error(`sendInitOTP error: ${JSON.stringify(sr)}`)
          res.json({data:null,errcode:sr.errcode.errCode,errmsg:sr.errcode.errMsg})
          return
        }

    } catch (error) {
        logger.error('Error verifySignature err:', error);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

}

//https://docs.turnkey.com/api-reference/activities/otp-auth
export async function apiOTPAuth(req: Request, res: Response) {
    console.log(`apiOTPAuth params: `, req.body)
    const {organizationId,otpId,otpCode,targetPublicKey} = req.body
    if (!organizationId || organizationId == "" || !otpId || otpId == "" || !otpCode || otpCode == "" || !targetPublicKey || targetPublicKey == "") {
        logger.error(`apiOTPAuth invalid params: ${JSON.stringify(req.body)}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    const expirationSeconds="2592000" //会话有效期 720h

    const sr = await services.otpAuth(organizationId,otpId,otpCode,targetPublicKey,expirationSeconds)
    if (sr&&sr.errcode.errCode==ErrorCodes.OK) {
      //获取组织下的钱包和钱包account信息
      const swr= await services.getSubOrgWallets(organizationId)
      
      if (swr&&swr.errcode.errCode==ErrorCodes.OK) {
        const r={
          ...sr.result,
          ...swr.result,
          expirationSeconds:expirationSeconds,
        }
        console.log(`apiOTPAuth result: ${JSON.stringify(r)}`)
        res.json({data:r,errcode:swr.errcode.errCode,errmsg:swr.errcode.errMsg})
        return
      }else{
        logger.error(`apiOTPAuth failed`)
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
        res.json({data:null,errcode:ec.errCode,errmsg:ec.errMsg})
        return
      }
    }else{
        logger.error(`apiOTPAuth failed`)
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
        res.json({data:null,errcode:ec.errCode,errmsg:ec.errMsg})
        return
    }

}

