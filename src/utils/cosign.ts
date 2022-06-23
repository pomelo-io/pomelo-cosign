import { SigningRequest } from 'eosio-signing-request'
import {
    PackedTransaction,
    Signature,
    Transaction,
} from '@greymass/eosio'

import { Cosigner } from '../types'

import { opts } from './esr'
import { signTransaction } from './sign'

export async function cosignTransaction(
    cosigner: Cosigner,
    tx: PackedTransaction
): Promise<{
    result: SigningRequest,
    signatures: Signature[],
    transaction: Transaction,
}> {
    // Sign the transaction
    const transaction = tx.getTransaction()
    const signatures: Signature[] = []
    signatures.push(signTransaction(cosigner.private, transaction))

    // Convert the modified transaction into a request for the client
    const result = await SigningRequest.create({
        transaction
    }, opts)

    return {
        result,
        signatures,
        transaction,
    }
}
