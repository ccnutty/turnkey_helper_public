
import { DEFAULT_BITCOIN_TESTNET_P2TR_ACCOUNTS, Turnkey,server } from "@turnkey/sdk-server";
import { TurnkeySigner } from "@turnkey/solana";
import { Transaction, VersionedTransaction,Connection,PublicKey, SystemProgram } from '@solana/web3.js';
import * as config from '../config'
import { logger } from '../pkg/log'
import { ErrorCode, ErrorCodes, getErrorCode } from '../pkg/errcode'
import {SOLANA_ADDRESS_FORMAT,MNEMONIC_LENGTHS} from '../turnkey_const';
import { generateTKDelegatedKeyPairWithVerify } from './wallet_util_service';
import { RedisHelper } from '../common';
import * as tkutils from '../tkutils'
import { CreateSubOrgByWalletAuthParams,CreateSubOrgByEmailParams,CreateSubOrgByOAuthParams,CreateSubOrgByWalletAuthResult,TKDelegatedKeyPair,GetWalletByOrgIdResult } from '../models/bo';


const turnkey = new Turnkey({
    apiBaseUrl: config.TURNKEY_BASE_URL!,
    defaultOrganizationId: config.TURNKEY_ORGANIZATION_ID!,
    apiPublicKey: config.TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: config.TURNKEY_API_PRIVATE_KEY!,
  });


const turnkeyApiClient = turnkey.apiClient();
export const connection = new Connection("https://go.getblock.io/865eee46c8fd4b6bbdd9d06eed8183d3", 'confirmed');


export async function getSubOrgId(filterType:string|"EMAIL"|"PUBLIC_KEY"|"USERNAME"|"OIDC_TOKEN",filterValue:string): Promise<{organizationId:string,errcode:ErrorCode}> {
    try {
        const { organizationIds } = await turnkeyApiClient.getSubOrgIds({
            organizationId: config.TURNKEY_ORGANIZATION_ID,
            filterType: filterType,
            filterValue: filterValue,
          });

        if (organizationIds.length >0) {
            const ec = getErrorCode(ErrorCodes.OK)
            return {organizationId: organizationIds[0],errcode: ec}
        }else{
            const ec = getErrorCode(ErrorCodes.SUB_ORG_NOT_FOUND)
            return {organizationId: "",errcode: ec}
        }
       
    } catch (error) {
        logger.error('Error getSubOrgByWalletAuth err:', error);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        return  {organizationId: "",errcode: ec}
    }

}


// export async function createSubOrgByWalletAuth(params:CreateSubOrgByWalletAuthParams): Promise<{result:CreateSubOrgByWalletAuthResult|null,errcode:ErrorCode}> {
//     console.log(`createSubOrgByWalletAuth params: `, JSON.stringify(params))

//     const { publicKey,loginType,loginAccount,curveType } = params

//     try {
//         //gen delegated account keypair
//         // it generate a keypair by turnkey cli,recommended only use CURVE_P256
//         const tkDelegatedKeyPair = generateTKDelegatedKeyPairWithVerify("CURVE_P256");
//         //verify keypair
//         const tkDelegatedKeyPairStr = JSON.stringify(tkDelegatedKeyPair);

//         //root users: 1.end user 2. delegated account
//         console.log(`createSubOrgByWalletAuth loginAccount: ${loginAccount},publicKey: ${publicKey},curveType: ${curveType}`)
//         const rootUsers = await buildSubOrgRootUsersWithWallet(loginAccount,publicKey,curveType,tkDelegatedKeyPair);
//         console.log(`createSubOrgByWalletAuth rootUsers: ${JSON.stringify(rootUsers, null, 2)}`)

//         //build default solana wallet account
//         const dftSolWalletAccount=buildDefaultSolanaWalletAccount();

//         //create sub organization
//         const csoResult = await turnkeyApiClient.createSubOrganization({
//                 organizationId: turnkey.config.defaultOrganizationId,
//                 subOrganizationName: `User - ${loginAccount}`,
//                 rootUsers: rootUsers,
//                 rootQuorumThreshold: 1,
//                 wallet: { walletName: "Default Solana Wallet", accounts: [dftSolWalletAccount],mnemonicLength: MNEMONIC_LENGTHS.L12},
//             });
        

//         console.log(`create sub organization result: `, JSON.stringify(csoResult))
//         if (csoResult.subOrganizationId&&csoResult.wallet&&csoResult.rootUserIds) {
//             const ec = getErrorCode(ErrorCodes.OK)
//             logger.info(`create sub organization success: ${JSON.stringify(csoResult)}`)
//             console.log(`subOrganizationId: ${csoResult.subOrganizationId}`)
//             console.log(`wallet: ${JSON.stringify(csoResult.wallet)}`)
//             console.log(`rootUserIds: ${JSON.stringify(csoResult.rootUserIds)}`)
//             const cr:CreateSubOrgByWalletAuthResult = {
//                 subOrganizationId: csoResult.subOrganizationId,
//                 wallet: {
//                     walletId: csoResult.wallet.walletId,
//                     addresses: csoResult.wallet.addresses
//                 },
//                 rootUserIds: csoResult.rootUserIds
//             }

//             // save delegated account keypair to redis, only for dev environment
//             // !!!!! delegated account keypair should be saved to kms!!!!!
//             const key:string = `tk_delegated_key_pair`;
//             const field:string = csoResult.subOrganizationId;
//             await RedisHelper.hset(key,field, tkDelegatedKeyPairStr);
//             console.log(`tk_delegated_key_pair saved to redis,sub org id: ${csoResult.subOrganizationId},keypair: ${tkDelegatedKeyPairStr}`);

//             return {result: cr,errcode: ec}
//         }else{
//             logger.error(`create sub organization failed: ${JSON.stringify(csoResult)}`)
//             const ec = getErrorCode(ErrorCodes.TURNKEY_SVR_ERROR)
//             return {result: null,errcode: ec}
//         }
//     } catch (err:any) {
//         logger.error('Error get token in:', err);
//         console.error(err.stack);
//         const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
//         return {result: null,errcode: ec}
//     }

// }


//支持email,wallet和social 3种方式
export async function createSubOrg(params:CreateSubOrgByEmailParams|CreateSubOrgByWalletAuthParams|CreateSubOrgByOAuthParams): Promise<{result:CreateSubOrgByWalletAuthResult|null,errcode:ErrorCode}> {
    console.log(`createSubOrg params: `, JSON.stringify(params))
    try {
        //gen delegated account keypair
        // it generate a keypair by turnkey cli, only use CURVE_P256
        const tkDelegatedKeyPair = generateTKDelegatedKeyPairWithVerify("CURVE_P256");
        const tkDelegatedKeyPairStr = JSON.stringify(tkDelegatedKeyPair);
        let rootUsers:any[] = [];
        let subOrganizationName = "";
        if ("providerName" in params) {///oauth
            if (params.providerName=="google") {
                // google
                subOrganizationName = `User - ${params.email}`
                rootUsers = await buildSubOrgRootUsersWithOAuth(params.email!,params.providerName!,params.oidcToken!,tkDelegatedKeyPair);
                console.log(`createSubOrg by oauth, rootUsers: ${JSON.stringify(rootUsers, null, 2)}`)
            }
        }else if ("email" in params) {//email
            subOrganizationName = `User - ${params.email}`
            rootUsers = await buildSubOrgRootUsersWithEmail(params.email!,tkDelegatedKeyPair);
            console.log(`createSubOrg by email, rootUsers: ${JSON.stringify(rootUsers, null, 2)}`)
        }else if ("curveType" in params) {//wallet
            const { publicKey,loginType,loginAccount,curveType } = params
            subOrganizationName = `User - ${loginAccount}`
            rootUsers = await buildSubOrgRootUsersWithWallet(loginAccount,publicKey,curveType,tkDelegatedKeyPair);
            console.log(`createSubOrg by wallet, rootUsers: ${JSON.stringify(rootUsers, null, 2)}`)
        }

        //build default solana wallet account
        const dftWalletAccounts = [buildDefaultSolanaWalletAccount()];

        //create sub organization
        const csoResult = await turnkeyApiClient.createSubOrganization({
                organizationId: turnkey.config.defaultOrganizationId,
                subOrganizationName: subOrganizationName,
                rootUsers: rootUsers,
                rootQuorumThreshold: 1,
                wallet: { walletName: "Default Solana Wallet", accounts: dftWalletAccounts,mnemonicLength: MNEMONIC_LENGTHS.L12},
            });
        

        console.log(`create sub organization result: `, JSON.stringify(csoResult))
        if (csoResult.subOrganizationId&&csoResult.wallet&&csoResult.rootUserIds) {
            const ec = getErrorCode(ErrorCodes.OK)
            logger.info(`create sub organization success: ${JSON.stringify(csoResult)}`)
            console.log(`subOrganizationId: ${csoResult.subOrganizationId}`)
            console.log(`wallet: ${JSON.stringify(csoResult.wallet)}`)
            console.log(`rootUserIds: ${JSON.stringify(csoResult.rootUserIds)}`)
            const newlyWalletAccounts = [];
            for (const dftWalletAccount of dftWalletAccounts) {
                const chainId = getChainIdFromPath(dftWalletAccount.path);
                const newlyWalletAccount = {
                    curve: dftWalletAccount.curve,
                    pathFormat: dftWalletAccount.pathFormat,
                    path: dftWalletAccount.path,
                    addressFormat: dftWalletAccount.addressFormat,
                    address: csoResult.wallet.addresses[0],
                    chainId: chainId,
                }
                newlyWalletAccounts.push(newlyWalletAccount);
            }

            const cr:CreateSubOrgByWalletAuthResult = {
                subOrganizationId: csoResult.subOrganizationId,
                wallet: {
                    walletId: csoResult.wallet.walletId,
                    accounts: newlyWalletAccounts,
                },
                rootUserIds: csoResult.rootUserIds
            }

            // save delegated account keypair to redis, only for dev environment
            // !!!!! delegated account keypair should be saved to kms!!!!!
            const key:string = `tk_delegated_key_pair`;
            const field:string = csoResult.subOrganizationId;
            await RedisHelper.hset(key,field, tkDelegatedKeyPairStr);
            console.log(`tk_delegated_key_pair saved to redis,sub org id: ${csoResult.subOrganizationId},keypair: ${tkDelegatedKeyPairStr}`);

            return {result: cr,errcode: ec}
        }else{
            logger.error(`create sub organization failed: ${JSON.stringify(csoResult)}`)
            const ec = getErrorCode(ErrorCodes.TURNKEY_SVR_ERROR)
            return {result: null,errcode: ec}
        }
    } catch (err:any) {
        logger.error('Error get token in:', err);
        console.error(err.stack);
        const ec = getErrorCode(ErrorCodes.SERVER_ERROR);
        return {result: null,errcode: ec}
    }

}

async function buildSubOrgRootUsersWithWallet(loginAccount:string,publicKey:string,curveType:string,tkDelegatedKeyPair:TKDelegatedKeyPair):Promise<any[]> {
    //save keypair to redis,need change to kms
    const rootUsers = [
        {
            userName: `User - ${loginAccount}`,
            apiKeys: [
                {
                    apiKeyName: `User - ${loginAccount}`, 
                    publicKey: publicKey, //用户钱包的公钥
                    curveType: curveType as "API_KEY_CURVE_ED25519" | "API_KEY_CURVE_SECP256K1"  //曲线类型需要和用户钱包的曲线类型一致，如果是eth，则需要使用API_KEY_CURVE_SECP256K1,如果是solana，则需要使用API_KEY_CURVE_ED25519
                },
            ],
            authenticators: [],
            oauthProviders: []
        },
        {
            userName: `Delegated Account - ${loginAccount}`,
            apiKeys: [
                {
                    apiKeyName: `Delegated Account - ${loginAccount}`, 
                    publicKey: tkDelegatedKeyPair.publicKeyHex, //d
                    curveType: "API_KEY_CURVE_P256" as "API_KEY_CURVE_ED25519" | "API_KEY_CURVE_SECP256K1" | "API_KEY_CURVE_P256" //固定为API_KEY_CURVE_P256即可，要与生成的delegated account keypair的curveType一致
                },
            ],
            authenticators: [],
            oauthProviders: []
        }
    ];

    return rootUsers;
}


async function buildSubOrgRootUsersWithEmail(email:string,tkDelegatedKeyPair:TKDelegatedKeyPair):Promise<any[]> {
    //save keypair to redis,need change to kms
    const rootUsers = [
        {
            userName: `User - ${email}`,
            userEmail: email,
            apiKeys: [],
            authenticators: [],
            oauthProviders: []
        },
        {
            userName: `Delegated Account - ${email}`,
            apiKeys: [
                {
                    apiKeyName: `Delegated Account - ${email}`, 
                    publicKey: tkDelegatedKeyPair.publicKeyHex, //d
                    curveType: "API_KEY_CURVE_P256" as "API_KEY_CURVE_ED25519" | "API_KEY_CURVE_SECP256K1" | "API_KEY_CURVE_P256" //固定为API_KEY_CURVE_P256即可，要与生成的delegated account keypair的curveType一致
                },
            ],
            authenticators: [],
            oauthProviders: []
        }
    ];

    return rootUsers;
}

async function buildSubOrgRootUsersWithOAuth(loginAccount:string,providerName:string,oidcToken:string,tkDelegatedKeyPair:TKDelegatedKeyPair):Promise<any[]> {
     //save keypair to redis,need change to kms
     const rootUsers = [
        {
            userName: `User - ${loginAccount}`,
            apiKeys: [],
            authenticators: [],
            oauthProviders: [
                {
                    providerName: providerName,
                    oidcToken: oidcToken,
                }
            ]
        },
        {
            userName: `Delegated Account - ${loginAccount}`,
            apiKeys: [
                {
                    apiKeyName: `Delegated Account - ${loginAccount}`, 
                    publicKey: tkDelegatedKeyPair.publicKeyHex,
                    curveType: "API_KEY_CURVE_P256" as "API_KEY_CURVE_ED25519" | "API_KEY_CURVE_SECP256K1" | "API_KEY_CURVE_P256" //固定为API_KEY_CURVE_P256即可，要与生成的delegated account keypair的curveType一致
                },
            ],
            authenticators: [],
            oauthProviders: []
        }
    ];

    return rootUsers;
}

function buildDefaultSolanaWalletAccount():any {
    return {
        curve: SOLANA_ADDRESS_FORMAT.curve as "CURVE_ED25519" | "CURVE_SECP256K1",
        pathFormat: SOLANA_ADDRESS_FORMAT.pathFormat as "PATH_FORMAT_BIP32",
        path: SOLANA_ADDRESS_FORMAT.path as string,
        addressFormat: SOLANA_ADDRESS_FORMAT.addressFormat as "ADDRESS_FORMAT_SOLANA" ,
    };
}


export async function deleteSubOrg(subOrganizationId:string) {
    const timestampMs = Date.now();
    const result = await turnkeyApiClient.deleteSubOrganization({
        organizationId: subOrganizationId,
        deleteWithoutExport: true,
        timestampMs: timestampMs.toString(),
    });
    return result;
}

export async function deletgateSignTx(params:{walletAddress:string,subOrganizationId:string,unsignedTxHex:string,txVersion:string,deletgatedAPIPublicKey:string,deletgatedAPIPrivateKey:string}) {
    //deletgate access client
    const turnkeyDelegated = new Turnkey({
        apiBaseUrl: config.TURNKEY_BASE_URL!,
        apiPublicKey: params.deletgatedAPIPublicKey,
        apiPrivateKey: params.deletgatedAPIPrivateKey,
        defaultOrganizationId: params.subOrganizationId,
    }).apiClient();

    if(params.txVersion=="V0"||params.txVersion=="Legacy"){
        const { signedTransaction } = await turnkeyDelegated.signTransaction({
            signWith: params.walletAddress,
            type: "TRANSACTION_TYPE_SOLANA",
            unsignedTransaction: params.unsignedTxHex,
          });
        const txId = await broadcastTxHex(signedTransaction)
        return txId;
    }else{
        throw new Error(`Invalid txVersion: ${params.txVersion}`);
    }

}

async function broadcastTxHex(txHex:string){
    // const transaction = Transaction.from(Buffer.from(signedTxHex, "hex"));
    const txId=await connection.sendRawTransaction(Buffer.from(txHex, "hex"), {
		skipPreflight: false,
		maxRetries: 3,
	})
    return txId;
}


export async function testGetUnsignedTransaction(senderAddress: string) {
    const LAMPORTS_PER_SOL = 1000000000;
    const senderPublicKey=new PublicKey(senderAddress);
    const receiverPublicKey=new PublicKey('GkVfu4wubTymS2PVs884apYx1QpU6kbnjAK5Sg1barDF');

    let ti=  SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: receiverPublicKey,
        lamports: 0.0001 * LAMPORTS_PER_SOL, // 发送1 SOL
    })

    const latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction().add(ti);
    transaction.feePayer=senderPublicKey;
    transaction.recentBlockhash = latestBlockhash.blockhash;
    let unsignedTxBuf = transaction.serialize({requireAllSignatures: false})
    return unsignedTxBuf.toString("hex");

}


export async function sendEmailAuth(email:string,targetPublicKey:string,organizationId:string) {
    const magicLinkTemplate = getMagicLinkTemplate("auth", email, "email")
    const result = await turnkeyApiClient.emailAuth({
        email: email,
        targetPublicKey: targetPublicKey,
        organizationId: organizationId,
        emailCustomization: {
            magicLinkTemplate
        }
    });
    return result;
}

export function getMagicLinkTemplate(action:string,email:string,method:string) {
    var url=``
    return `${url}/email-${action}?userEmail=${email}&continueWith=${method}&credentialBundle=%s`
}

export async function sendInitOTP(organizationId:string,otpType:string|"OTP_TYPE_EMAIL"|"OTP_TYPE_SMS",contract:string,targetPublicKey:string):Promise<{otpId:string,errcode:ErrorCode}> {
    const initAuthResponse = await server.sendOtp({
        suborgID: organizationId,
        otpType: otpType,
        contact: contract,
        userIdentifier: targetPublicKey,
        otpLength: 6,
        alphanumeric: false,
        // sendFromEmailAddress: "noreply@1keeper.com",// it should add the domain to whitelist,customer
        // sendFromEmailSenderName: "1Keeper",
      });


    if (!initAuthResponse || !initAuthResponse.otpId!) {
        const ec = getErrorCode(ErrorCodes.TURNKEY_SVR_ERROR)
        return {otpId: "",errcode: ec}
    }

    const ec = getErrorCode(ErrorCodes.OK)
    return {otpId: initAuthResponse.otpId,errcode: ec}
}

export async function otpAuth(organizationId:string,otpId:string,otpCode:string,targetPublicKey:string,expirationSeconds:string):Promise<{result:any,errcode:ErrorCode}> {
    try {
        // const verifyAuthResponse = await server.verifyOtp({
        //     suborgID: organizationId,
        //     otpId: otpId,
        //     otpCode: otpCode,
        //     targetPublicKey: targetPublicKey,
        //     sessionLengthSeconds: sessionLengthSeconds,
        // });

        const otpAuthResponse = await turnkeyApiClient.otpAuth({
            organizationId: organizationId,
            otpId: otpId,
            otpCode: otpCode,
            targetPublicKey: targetPublicKey,
            expirationSeconds: expirationSeconds,
        });

        console.log(`otpAuthResponse: ${JSON.stringify(otpAuthResponse)}`)

        const { credentialBundle, apiKeyId, userId } = otpAuthResponse;

        if (!otpAuthResponse) {
            console.log(`otpAuth failed,err response: ${JSON.stringify(otpAuthResponse)}`)
            const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
            return {result: null,errcode: ec}
        }

        const ec = getErrorCode(ErrorCodes.OK)
        return {result: {
            credentialBundle: credentialBundle,
            apiKeyId: apiKeyId,
            userId: userId,
        },errcode: ec}
    } catch (err:any) {
        logger.error('Error otpAuth:', err);
        console.error(err.stack);
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED);
        return {result: null,errcode: ec}
    }
}

export async function oauth(organizationId:string,oidcToken:string,targetPublicKey:string,expirationSeconds:string):Promise<{result:any,errcode:ErrorCode}> {
    try {
        const oauthResponse = await turnkeyApiClient.oauth({
            organizationId: organizationId,
            oidcToken: oidcToken,
            targetPublicKey: targetPublicKey,
            expirationSeconds: expirationSeconds,
            invalidateExisting: true,
        });

        console.log(`oauthResponse: ${JSON.stringify(oauthResponse)}`)

        const { credentialBundle, apiKeyId, userId } = oauthResponse;

        if (!oauthResponse) {
            console.log(`otpAuth failed,err response: ${JSON.stringify(oauthResponse)}`)
            const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED)
            return {result: null,errcode: ec}
        }

        const ec = getErrorCode(ErrorCodes.OK)
        return {result: {
            credentialBundle: credentialBundle,
            apiKeyId: apiKeyId,
            userId: userId,
        },errcode: ec}
    } catch (err:any) {
        logger.error('Error otpAuth:', err);
        console.error(err.stack);
        const ec = getErrorCode(ErrorCodes.OTP_VERIFY_FAILED);
        return {result: null,errcode: ec}
    }

}

function getChainIdFromPath(path:string):number {
    const matches = [...path.matchAll(/\/(\d+)'/g)];
    if (matches.length >= 2) {
        const second = matches[1][1]; // "501"
        return parseInt(second);
    }
    return 0;
}


// get sub org wallets and root users
export async function getSubOrgWallets(organizationId:string):Promise<{result:GetWalletByOrgIdResult|null,errcode:ErrorCode}> {

    const result:GetWalletByOrgIdResult = {
        organizationId: organizationId,
        wallets: [],
        rootUsers: [],
    }

    //get root users
    const rootUsers = await turnkeyApiClient.getUsers({
        organizationId: organizationId,
    });

    console.log(`getSubOrgWallets rootUsers: ${JSON.stringify(rootUsers)}`)

    for (const user of rootUsers.users) {
        if (user.userName.startsWith("User - ")) {
            result.rootUsers.push({
                userId: user.userId,
                userName: stripUserPrefix(user.userName),
            });
        }
    }

    //get wallets
    const wallets = await turnkeyApiClient.getWallets({
        organizationId: organizationId,
    });

    if (wallets.wallets.length == 0) {
        const ec = getErrorCode(ErrorCodes.OK)
        return {result: null,errcode: ec}
    }

    for (const wallet of wallets.wallets) {
        const walletAccounts = await turnkeyApiClient.getWalletAccounts({
            organizationId: organizationId,
            walletId: wallet.walletId,
        });

        const accounts:any[] = [];
        for (const walletAccount of walletAccounts.accounts) {
            const chainId = getChainIdFromPath(walletAccount.path);
            const account={
                chainId: chainId,
                curve: walletAccount.curve,
                pathFormat: walletAccount.pathFormat,
                path: walletAccount.path,
                addressFormat: walletAccount.addressFormat,
                address: walletAccount.address,
            }
            accounts.push(account);
        }

        result.wallets.push({
            walletId: wallet.walletId,
            accounts: accounts,
        });
       
    }

    console.log(`getSubOrgWallets result: ${JSON.stringify(result)}`)

    const ec = getErrorCode(ErrorCodes.OK)
    return {result: result,errcode: ec}
}


function stripUserPrefix(input: string): string {
    const prefix = 'User - ';
    return input.startsWith(prefix)
      ? input.slice(prefix.length)
      : input;
}