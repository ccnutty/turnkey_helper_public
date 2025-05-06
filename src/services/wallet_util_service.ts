import {VerifySignatureParams} from '../models/bo'
import { logger } from '../pkg/log';

import nacl from "tweetnacl";
import base58 from "bs58";
import { PublicKey } from '@solana/web3.js';

import { p256 } from '@noble/curves/p256';

import { TKDelegatedKeyPair } from "../models/bo";
import * as tkutils from '../tkutils'

//钱包工具类，目前仅用于验证签名
    
    //solana 签名验证
export function verifySignature(req: VerifySignatureParams): boolean {
    if(!req.address || !req.signature){
        logger.error('address or signature is empty')
        return false
    }

    const pk=req.address
    const signature=req.signature
    const message=req.message
    const addressPublicKey = new PublicKey(req.address); // 用户的钱包地址
    const bySignature = base58.decode(signature);

    logger.debug(`verifySignature address:${pk}, signature:${signature}, message:${message}`)

    const messageBytes = Buffer.from(message);

    let verifySignatureResult = nacl.sign.detached.verify(
        messageBytes,
        bySignature,
        addressPublicKey.toBytes()
    );

    console.log('verifySignatureResult:', verifySignatureResult);
    return verifySignatureResult

}

/**
 * 生成并验证TKDelegatedKeyPair
 * @param curveType 曲线类型，目前仅支持CURVE_P256
 * @returns 验证通过的TKDelegatedKeyPair
 */
export function generateTKDelegatedKeyPairWithVerify(curveType:"CURVE_P256"): TKDelegatedKeyPair {
    let maxRetry=1000
    let retryCount=0
    while (retryCount<maxRetry) {
        const tkDelegatedKeyPair = generateTKDelegatedKeyPair(curveType);

        try {
            const jwk = tkutils.convertTurnkeyApiKeyToJwk({
                uncompressedPrivateKeyHex: tkDelegatedKeyPair.privateKeyHex,
                compressedPublicKeyHex: tkDelegatedKeyPair.publicKeyHex,
            });

            console.log("✅ Successfully generated and verified a keypair.");
            return tkDelegatedKeyPair; // 成功，返回！
        } catch (error) {
            console.log(`❌ Verification failed, retrying... Error:`, error);
            retryCount++
        }
    }
    throw new Error("generateTKDelegatedKeyPairWithVerify failed")
}


/**
 * gen delegated account keypair for sub organization,curveType only support CURVE_P256
 * 
 * ⚠️⚠️⚠️ ONLY P256 WORKED
 * @param curveType 
 * @returns 
 */
export function generateTKDelegatedKeyPair(curveType:"CURVE_P256"): TKDelegatedKeyPair {
    if(curveType=="CURVE_P256"){
        // P-256
        const p256Priv = p256.utils.randomPrivateKey();
        const p256Pub = p256.getPublicKey(p256Priv, true); // compressed
        console.log("🔑 P-256 Private:", bytesToHex(p256Priv));
        console.log("🔓 P-256 Public:", bytesToHex(p256Pub));
        return {
            publicKeyHex: bytesToHex(p256Pub),
            privateKeyHex: bytesToHex(p256Priv),
        };
    }
    console.log("Invalid curve type,only support CURVE_P256");
    throw new Error("Invalid curve type");
}

function bytesToHex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
}



