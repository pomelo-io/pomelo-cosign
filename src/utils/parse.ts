import { SigningRequest } from 'eosio-signing-request'

import {
    AnyAction,
    Name,
    PackedTransaction,
    Transaction,
} from '@greymass/eosio'

import { getCacheAbi, opts } from './esr'

export async function parseRequest(body: any): Promise<SigningRequest | false> {
    try {
        // Resource Provider Specification: Process based on ESR payload
        if (body.request) {
            return await SigningRequest.from(body.request, opts)
        }

        // Resource Provider Specification: Process based on deserialized transaction
        if (body.transaction) {
            const contracts: Name[] = body.transaction.actions.map((action: AnyAction) => Name.from(action.account))
            const abis = await Promise.all(contracts.map(async (account: Name) => {
                return {
                    contract: account,
                    abi: await getCacheAbi(Name.from(account))
                }
            }))
            const decoded = Transaction.from(body.transaction, abis)
            return await SigningRequest.create({
                transaction: decoded
            }, opts)
        }

        // Resource Provider Specification: Process based on packed transaction
        if (body.packedTransaction) {
            const decoded = PackedTransaction.from(body.packedTransaction)
            return await SigningRequest.create({
                transaction: decoded.getTransaction()
            }, opts)
        }
    } catch (error) {
        console.log({ error }, 'error parsing incoming transaction')
    }

    return false
}
