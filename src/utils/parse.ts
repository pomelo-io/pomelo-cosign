import { SigningRequest } from 'eosio-signing-request'

import {
    AnyAction,
    Name,
    Transaction,
} from '@greymass/eosio'

import { getCacheAbi, opts } from './esr'

export async function parseRequest(body: any): Promise<Transaction | false> {
    try {

        // Resource Provider Specification: Process based on deserialized transaction
        if (body.transaction) {
            const contracts: Name[] = body.transaction.actions.map((action: AnyAction) => Name.from(action.account))
            const abis = await Promise.all(contracts.map(async (account: Name) => {
                return {
                    contract: account,
                    abi: await getCacheAbi(Name.from(account))
                }
            }))
            return Transaction.from(body.transaction, abis)
        }
    } catch (error) {
        console.log({ error }, 'error parsing incoming transaction')
    }

    return false
}
