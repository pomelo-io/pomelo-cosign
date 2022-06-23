import {
    ABI,
    PackedTransaction,
    Serializer,
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
): PackedTransaction {
    // Recreate the transaction
    const modified = Transaction.from({
        ...transaction,
        // prepend the noop action before the rest of the actions
        actions: [
            getNoopAction(cosigner),
            ...transaction.actions,
        ],
        // specify the CPU restrictions on the transaction
        max_cpu_usage_ms: MAX_CPU_USAGE_MS,
    }, [{
        contract: COSIGN_CONTRACT,
        abi: noopAbi
    }])
    // Return the packed + unsigned transaction
    return PackedTransaction.from({
        signatures: [],
        packed_context_free_data: '',
        packed_trx: Serializer.encode({object: modified}),
    })
}

export function getNoopAction(cosigner: Cosigner) {
    return {
        account: COSIGN_CONTRACT,
        name: 'noop',
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
        name: 'noop',
        base: '',
        fields: []
        }
    ],
    actions: [
        {
            name: 'noop',
            type: 'noop',
            ricardian_contract: 'This action does nothing.'
        }
    ],
    tables: [],
    ricardian_clauses: [],
    variants: []
})
