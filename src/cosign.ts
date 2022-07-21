import {
    Transaction,
    Checksum256,
    Name,
    AnyAction,
    ABI,
    ABIDef,
    API,
    PermissionLevel,
} from '@greymass/eosio'

import {
    CHAIN_ID,
    COSIGN_CONTRACT,
    POMELO_COSIGNER,
    client,
} from './config'

import { Cosigner } from './types'

export async function cosignTransaction( transaction: Transaction ) {
    const digest = transaction.signingDigest(Checksum256.from(CHAIN_ID))

    return POMELO_COSIGNER.private.signDigest(digest)
}


export async function parseRequest(body: any): Promise<Transaction | false> {
    try {
        // Resource Provider Specification: Process based on deserialized transaction
        if (body.transaction) {
            const info = await client.v1.chain.get_info();
            const contracts: Name[] = body.transaction.actions.map((action: AnyAction) => Name.from(action.account))
            const abis = await Promise.all(contracts.map(async (account: Name) => {
                return {
                    contract: account,
                    abi: await getCacheAbi(Name.from(account))
                }
            }))
            return Transaction.from({
                ...info.getTransactionHeader(300),
                ...body.transaction
            }
            , abis)
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
            name: 'noop',
            base: '',
            fields: [{
                name: "referrer",
                type: "name?"
            }]
        }
    ],
    actions: [
        {
            name: 'noop',
            type: 'noop',
            ricardian_contract: "---\nspec_version: \"0.2.0\"\ntitle: noop\nsummary: 'Transaction CPU is covered by Pomelo.'\nicon: https://gateway.pinata.cloud/ipfs/QmNbkDh7ZSkRf7j1peg9YnDoBnJbVg5TMdRfVGYV3hxhhD#b74cf8b3d884f42fffea4bfe7070b3871e1845805c57973a48324af1228ad9cc\n---\n\nSupport the public good projects you love.\n\nPomelo is an open-source crowdfunding platform that multiplies your contributions."
        }
    ],
    tables: [],
    ricardian_clauses: [],
    variants: []
})

export function prependNoopAction( transaction: Transaction, referrer?: string ): Transaction {
    // Recreate the transaction
    const signer = transaction.actions[0].authorization[0];
    return Transaction.from({
        ...transaction,
        // prepend the noop action before the rest of the actions
        actions: [
            getNoopAction(POMELO_COSIGNER, signer, referrer),
            ...transaction.actions,
        ],
        // specify the CPU restrictions on the transaction
        // max_cpu_usage_ms: MAX_CPU_USAGE_MS,
    }, [{
        contract: COSIGN_CONTRACT,
        abi: noopAbi
        }]
    )
}

export function getNoopAction(cosigner: Cosigner, signer: PermissionLevel, referrer?: string) {
    return {
        account: COSIGN_CONTRACT,
        name: noopAbi.actions[0].name,
        authorization: [
            {
                actor: cosigner.account,
                permission: cosigner.permission,
            },
            signer
        ],
        data: {
            referrer,
        },
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
