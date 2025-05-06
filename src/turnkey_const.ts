/*

Address formats and curves
See below for specific address formats that you can currently derive on Turnkey:

https://docs.turnkey.com/concepts/wallets#address-formats-and-curves

https://docs.turnkey.com/api-reference/activities/create-sub-organization
*/

//turnkey constants
export const CURVE_TYPE_SECP256K1 = "SECP256K1";
export const CURVE_TYPE_ED25519 = "ED25519";

export const PATH_FORMAT_BIP32 = "PATH_FORMAT_BIP32";

export const SOLANA_ADDRESS_FORMAT={
    type: "solana",
    curve: "CURVE_ED25519",
    addressFormat: "ADDRESS_FORMAT_SOLANA",
    pathFormat: "PATH_FORMAT_BIP32",
    path: "m/44'/501'/0'/0'",
}

export const ETHEREUM_ADDRESS_FORMAT={
    type: "ethereum",
    curve: "CURVE_SECP256K1",
    addressFormat: "ADDRESS_FORMAT_ETHEREUM",
    pathFormat: "PATH_FORMAT_BIP32",
    path: "m/44'/60'/0'/0'",
}

//mnemonic length
export const MNEMONIC_LENGTHS ={
    L12: 12,
    L15: 15,
    L18: 18,
    L21: 21,
    L24: 24,
};


//mnemonic languages,exported from turnkey
export const MNEMONIC_LANGUAGES ={
    ENG: "MNEMONIC_LANGUAGE_ENGLISH",
    ZH: "MNEMONIC_LANGUAGE_SIMPLIFIED_CHINESE",
    TRADITIONAL_CHINESE: "MNEMONIC_LANGUAGE_TRADITIONAL_CHINESE",
    CZECH: "MNEMONIC_LANGUAGE_CZECH",
    FRENCH: "MNEMONIC_LANGUAGE_FRENCH",
    ITALIAN: "MNEMONIC_LANGUAGE_ITALIAN",
    JAPANESE: "MNEMONIC_LANGUAGE_JAPANESE",
    KOREAN: "MNEMONIC_LANGUAGE_KOREAN",
    SPANISH: "MNEMONIC_LANGUAGE_SPANISH",
};


export enum OtpType {
    Email = "OTP_TYPE_EMAIL",
    Sms = "OTP_TYPE_SMS",
}

export enum FilterType {
    Email = "EMAIL",
    PhoneNumber = "PHONE_NUMBER",
    OidcToken = "OIDC_TOKEN",
    PublicKey = "PUBLIC_KEY"
}