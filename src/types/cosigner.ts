import {
    Name,
    PublicKey,
    PrivateKey,
} from '@greymass/eosio'

// Cosigner records are loaded from MongoDB and refreshed automatically
export interface Cosigner {
    // Account name that will be the first authorizer
    account: Name,
    // Account permission that will be used as the first authorizer
    permission: Name,
    // The private key used to sign with
    private: PrivateKey,
    // The public key (derived automatically from private)
    public?: PublicKey
}

export interface AccountConfig {
    // Account name that will be the first authorizer
    name: string,
    // Account permission that will be used as the first authorizer
    permission: string,
    // The private key used to sign with
    key: string,
}
