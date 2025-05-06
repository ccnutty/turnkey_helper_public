import { Attestation, OauthProviderParams } from "../../types/turnkey";
import { WalletType } from "@turnkey/wallet-stamper"
export interface VerifySignatureParams {
    address: string;
    message: string;
    signature: string;
    referrer: string;
}


// "orgId": "0de6b37d-d2bd-4c81-9500-7334db8c9a0a",
// "userId": "03513ad1-17a1-4b9b-bc77-382861c529a1",
// "turnkeyUserId": "30682d58-5510-472b-9b03-9b3d684b54ba",
// "sol": "4mnKPcuxJ2bvnkq9y29CtNc9tdgF21R3hS1MQZ4AVn8H",
// "evm": "0x5796A97e0697170377F0beC552a33027a1728AA8",
// "isNewUser": true
export interface GetSubOrgResult {
    orgId: string;
    turnkeyUserId: string;
    sol: string;
    isNewUser: boolean;
}


export interface CreateSubOrgByWalletAuthParams {
    publicKey: string;
    loginType: string;
    loginAccount: string;
    curveType: string|"API_KEY_CURVE_ED25519"|"API_KEY_CURVE_SECP256K1";
}

export interface CreateSubOrgByEmailParams {
    email?: string
}

export interface CreateSubOrgByOAuthParams {
    name: string;
    email: string;
    providerName: string;
    oidcToken: string;
}

export interface CreateSubOrgByWalletAuthResult {
    subOrganizationId: string;
    wallet: {
        walletId: string;
        accounts: {
            chainId:number;
            curve: string;
            pathFormat: string;
            path: string;
            addressFormat: string;
            address: string;
        }[];
    };
    rootUserIds: string[];
}

export interface GetWalletByOrgIdResult {
    organizationId: string;
    wallets: {
        walletId: string;
        accounts: {
            chainId:number;
            curve: string;
            pathFormat: string;
            path: string;
            addressFormat: string;
            address: string;
        }[];
    }[];
    rootUsers: {
        userId: string;
        userName: string;
    }[];
}


//turnkey 自动化签名
export interface TKDelegatedKeyPair {
    publicKeyHex: string;    // Uncompressed 04开头
    privateKeyHex: string;   // 03开头
}