import {
    Checksum256,
    PrivateKey,
    Signature,
    Transaction,
} from '@greymass/eosio'

import { CHAIN_ID } from '../config'

export function signTransaction(
    privateKey: PrivateKey,
    transaction: Transaction
): Signature {
    const digest = transaction.signingDigest(Checksum256.from(CHAIN_ID))
    return privateKey.signDigest(digest)
}
