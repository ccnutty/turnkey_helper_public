import { logger } from '../pkg/log'
import {  ErrorCodes, getErrorCode } from '../pkg/errcode'
import { Request, Response } from 'express';

import * as services from '../services'
import { CreateSubOrgByWalletAuthParams } from '../models/bo'
import * as tkutils from '../tkutils'


//wallet_AUTH
export async function apiGetSubOrgByWalletAuth(req: Request, res: Response) {
    console.log(`getSubOrg params: `, req.body)
    const {publicKey} = req.body
    if (!publicKey || publicKey == "" ) {
        logger.error(`invalid params: ${JSON.stringify(req.body)}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    try {
        const {organizationId,errcode} = await services.getSubOrgId("PUBLIC_KEY",publicKey)

        if (errcode.errCode==ErrorCodes.OK) {
            console.log(`organizationId: `, organizationId)
            const swr = await services.getSubOrgWallets(organizationId)

            const expirationSeconds="2592000" //会话有效期 720h
            if (swr&&swr.errcode.errCode==ErrorCodes.OK) {
                // console.log(`wallets: `, wallets)
                const r={
                    organizationId: organizationId,
                    ...swr.result,
                    expirationSeconds:expirationSeconds,
                }
                res.json({ data: r, errcode: errcode.errCode, errmsg: errcode.errMsg })
                return
            }else{
                const ec = getErrorCode(ErrorCodes.SUB_ORG_NOT_FOUND)
                res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
                return
            }
        }else{
            const ec = getErrorCode(ErrorCodes.SUB_ORG_NOT_FOUND)
            res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
            return
        }
       
    } catch (error) {
        logger.error('Error verifySignature err:', error);
        // console.error(error.stack);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

}

export async function apiCreateSubOrgByWalletAuth(req: Request, res: Response) {
    console.log(`createSubOrgByPublicKey params: `, req.body)
    const { publicKey, curveType,loginType,loginAccount } = req.body
    if (!publicKey || publicKey == "" || !curveType || curveType == "" || !loginType || loginType == "" || !loginAccount || loginAccount == "" ) {
        logger.error(`invalid params: ${JSON.stringify(req.body)}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    if (curveType != "API_KEY_CURVE_ED25519" && curveType != "API_KEY_CURVE_SECP256K1") {
        logger.error(`invalid curveType: ${curveType}`)
        const ec = getErrorCode(ErrorCodes.PARAMS_ERROR)
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

    try {

        const params:CreateSubOrgByWalletAuthParams={
            publicKey,
            curveType,
            loginType,
            loginAccount
        }

        const {result,errcode} = await services.createSubOrg(params)
        if (errcode.errCode==ErrorCodes.OK && result) {
            const swr = await services.getSubOrgWallets(result.subOrganizationId)
            const expirationSeconds="2592000" //会话有效期 720h
            if (swr&&swr.errcode.errCode==ErrorCodes.OK) {
                const r={
                    organizationId: result.subOrganizationId,
                    ...swr.result,
                    expirationSeconds:expirationSeconds,
                }
                res.json({ data: r, errcode: errcode.errCode, errmsg: errcode.errMsg })
                return
            }else{
                res.json({ data: null, errcode: errcode.errCode, errmsg: errcode.errMsg })
                return
            }
        }else{
            res.json({ data: null, errcode: errcode.errCode, errmsg: errcode.errMsg })
            return
        }
        
    } catch (err:any) {
        logger.error('Error get token in:', err);
        console.error(err.stack);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        res.json({ data: null, errcode: ec.errCode, errmsg: ec.errMsg })
        return
    }

}

//仅作代理签名测试，验证通过后 可以删除
export async function apiDelegateSignTxTest(req: Request, res: Response) {
    console.log(`apiDelegateSignTx params: `, req.body)
    
    const tkWalletAddress="1qfHGn3tEAYsrxJ9zzZfz3SspfoGKPK17Ft7N6ZEngQ"
    const subOrganizationId="9442882d-f9e7-45eb-8fab-75b53e3fcc2e"
    const deletgatedAPIPublicKey="0342c3c1a6fa093bc5c59f3bfc3754188938782275722ee3e9dcff04046e05195d"
    const deletgatedAPIPrivateKey="9641abc31ace744d8c2f7eddb89d537758154df421a6eba4625736c13753a455"

    const unsignedTxHex=await services.testGetUnsignedTransaction(tkWalletAddress)
    const txVersion="Legacy"

    const params={
        walletAddress: tkWalletAddress,
        subOrganizationId: subOrganizationId,
        unsignedTxHex: unsignedTxHex,
        txVersion: txVersion,
        deletgatedAPIPublicKey: deletgatedAPIPublicKey,
        deletgatedAPIPrivateKey: deletgatedAPIPrivateKey
    }

    // const txId = await services.deletgateSignTx(tkWalletAddress,subOrganizationId,unsignedTxHex,txVersion,deletgatedAPIPublicKey,deletgatedAPIPrivateKey)
    const txId = await services.deletgateSignTx(params)
    console.log(`txId: `, txId)
    res.json({ data: txId, errcode: ErrorCodes.OK, errmsg: "OK" })

}


export async function apiTestKeypair(req: Request, res: Response) {
    console.log(`apiTestKeypair params: `, req.body)
    const { curveType } = req.body
    console.log(`curveType: `, curveType)
    const tkDelegatedKeyPair = services.generateTKDelegatedKeyPairWithVerify(curveType)
    console.log(`tkDelegatedKeyPair: `, tkDelegatedKeyPair)


    const jwk = tkutils.convertTurnkeyApiKeyToJwk({
        uncompressedPrivateKeyHex: tkDelegatedKeyPair.privateKeyHex,
        compressedPublicKeyHex: tkDelegatedKeyPair.publicKeyHex
    })
    console.log(`jwk: `, jwk)
    res.json({ data: jwk, errcode: ErrorCodes.OK, errmsg: "OK" })
}