import {
    Name,
    PublicKey,
    PrivateKey,
} from '@greymass/eosio'

export interface Cosigner {
    account: Name,
    permission: Name,
    private: PrivateKey,
}
