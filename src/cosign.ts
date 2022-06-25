import {
    Transaction,
    Checksum256,
    Name,
    AnyAction,
    ABI,
    ABIDef,
    API,
} from '@greymass/eosio'

import {
    CHAIN_ID,
    COSIGN_CONTRACT,
    client,
} from './config'

import { Cosigner } from './types'

export async function cosignTransaction( cosigner: Cosigner, transaction: Transaction ) {
    const digest = transaction.signingDigest(Checksum256.from(CHAIN_ID))

    return cosigner.private.signDigest(digest)
}


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

export async function validateTransaction(trx: Transaction): Promise<Boolean> {
    for( const action of trx.actions ) {
        // allow all actions for contracts
        if (['app.pomelo', 'login.eosn', 'd.app.pomelo', 'd.login.eosn'].includes(action.account.toString())) continue;

        // allow transfers to accounts
        if (action.name.toString() == 'transfer') {
            const abi = await getCacheAbi(action.account)
            const decoded = action.decodeData(abi) as any;
            if (['app.pomelo', 'd.app.pomelo', 'pomelo'].includes(decoded['to']?.toString())) continue;
        }
        return false;
    }

    return true
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

export function prependNoopAction( transaction: Transaction, cosigner: Cosigner ): Transaction {
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


interface ExpiringABIDef {
    abiDef: ABIDef | undefined
    age: number
}

const abiCache = new Map<string, ExpiringABIDef>()
const pendingAbis = new Map<string, Promise<API.v1.GetAbiResponse>>()
const maxAge = 1000 * 60

async function getCacheAbi(account: Name) {
    // Key used to cache the ABI
    const key = account.toString()
    // Attempt to load from storage
    let rv: ExpiringABIDef | undefined = abiCache.get(key)
    // Is the ABIDef cache expired?
    const now = new Date().getTime()
    const expired = rv ? now - rv.age > maxAge : false
    // If we have no cache or the cache is expired, reload
    if (!rv || expired) {
        let getAbi = pendingAbis.get(key)
        if (!getAbi) {
            getAbi = client.v1.chain.get_abi(account)
            pendingAbis.set(key, getAbi)
        }
        rv = {
            abiDef: (await getAbi).abi,
            age: new Date().getTime()
        }
        pendingAbis.delete(key)
        if (rv) {
            abiCache.set(key, rv)
        }
    }
    // Return the ABIDef
    return rv.abiDef as ABIDef
}
