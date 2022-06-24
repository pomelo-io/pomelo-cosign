import { SigningRequest } from 'eosio-signing-request'
import {
    PackedTransaction,
    Signature,
    Transaction,
} from '@greymass/eosio'

import { Cosigner } from '../types'

import { signTransaction } from './sign'

export async function cosignTransaction(
    cosigner: Cosigner,
    transaction: Transaction
): Promise<{
    signatures: Signature[],
    transaction: Transaction,
}> {
    // Sign the transaction
    return {
        signatures: [ signTransaction(cosigner.private, transaction) ],
        transaction,
    }
}
