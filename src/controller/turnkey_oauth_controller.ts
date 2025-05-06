import { logger } from '../pkg/log'
import { ErrorCode, ErrorCodes, getErrorCode } from '../pkg/errcode'
import { Request, Response } from 'express';
import * as services from '../services'


//oauth AUTH
export async function apiOAuth(req: Request, res: Response) {
    console.log(`apiOAuth params: `, req.body)
    const {oidcToken,providerName,targetPublicKey} = req.body
    if (!oidcToken || oidcToken == "" || !providerName || providerName == ""||!targetPublicKey||targetPublicKey == "") {
        logger.error(`invalid params: ${JSON.stringify(req.body)}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    //only support google oauth
    if (providerName != "google") {
        logger.error(`apiOAuth invalid provider: ${providerName}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }
 
    try {
        //解析google的credential
        const oidcTokenObj = parseGoogleOAuthJwt(oidcToken)
        //get sub org id
        let subOrgId=""
        const {organizationId,errcode} = await services.getSubOrgId("OIDC_TOKEN",oidcToken)
        if (errcode.errCode==ErrorCodes.OK) {
          subOrgId=organizationId
          console.log(`organizationId: `, organizationId)
        }else{
          //create sub org
          const {result,errcode} = await services.createSubOrg({
            name: oidcTokenObj.name,
            email: oidcTokenObj.email,
            providerName: "google",
            oidcToken: oidcToken,
          })
          if (errcode.errCode==ErrorCodes.OK) {
            console.log(`create sub org by oauth success: ${JSON.stringify(result)}`)
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

        //验证凭证
        apiOAuthVerify(subOrgId,targetPublicKey,oidcToken,res)

    } catch (error) {
        logger.error('Error verifySignature err:', error);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

}

//https://docs.turnkey.com/api-reference/activities/otp-auth
async function apiOAuthVerify(organizationId:string,targetPublicKey:string,oidcToken:string,res: Response) {
    
    const expirationSeconds="2592000" //会话有效期 720h

    const sr = await services.oauth(organizationId,oidcToken,targetPublicKey,expirationSeconds)
    if (sr&&sr.errcode.errCode==ErrorCodes.OK) {
      //获取组织下的钱包和钱包account信息
      const swr= await services.getSubOrgWallets(organizationId)
      
      if (swr&&swr.errcode.errCode==ErrorCodes.OK) {
        const r={
          ...sr.result,
          ...swr.result,
          expirationSeconds:expirationSeconds,
        }
        console.log(`apiOAuthVerify result: ${JSON.stringify(r)}`)
        res.json({data:r,errcode:swr.errcode.errCode,errmsg:swr.errcode.errMsg})
        return
      }else{
        logger.error(`apiOAuthVerify failed`)
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
        res.json({data:null,errcode:ec.errCode,errmsg:ec.errMsg})
        return
      }
    }else{
        logger.error(`apiOAuthVerify failed`)
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
        res.json({data:null,errcode:ec.errCode,errmsg:ec.errMsg})
        return
    }

}



function parseGoogleOAuthJwt(token:any) {
  const base64Url = token.split('.')[1];
  const base64 = decodeURIComponent(atob(base64Url).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(base64);
}
