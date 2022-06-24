import {
    ABI,
    Transaction,
} from '@greymass/eosio'

import {
    COSIGN_CONTRACT,
    MAX_CPU_USAGE_MS,
} from '../config'

import { Cosigner } from '../types'

export function prependNoopAction(
    transaction: Transaction,
    cosigner: Cosigner
): Transaction {
    // Recreate the transaction
    return Transaction.from({
        ...transaction,
        // prepend the noop action before the rest of the actions
        actions: [
            getNoopAction(cosigner),
            ...transaction.actions,
        ],
        // specify the CPU restrictions on the transaction
        // max_cpu_usage_ms: MAX_CPU_USAGE_MS,
    }, [{
        contract: COSIGN_CONTRACT,
        abi: noopAbi
    }])
}

export function getNoopAction(cosigner: Cosigner) {
    return {
        account: COSIGN_CONTRACT,
        name: 'freecpu',
        authorization: [
            {
                actor: cosigner.account,
                permission: cosigner.permission,
            },
        ],
        data: {},
    }
}

export const noopAbi = ABI.from({
    version: 'eosio::abi/1.1',
    types: [],
    structs: [
        {
        name: 'freecpu',
        base: '',
        fields: []
        }
    ],
    actions: [
        {
            name: 'freecpu',
            type: 'freecpu',
            ricardian_contract: 'This action does nothing.'
        }
    ],
    tables: [],
    ricardian_clauses: [],
    variants: []
})
