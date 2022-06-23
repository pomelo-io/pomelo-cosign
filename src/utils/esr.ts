import { ABIDef, API, Name } from '@greymass/eosio'

import { client } from '../config'

import util from 'util'
import zlib from 'zlib'
const textEncoder = new util.TextEncoder()
const textDecoder = new util.TextDecoder()

export const opts = {
    textEncoder,
    textDecoder,
    zlib: {
        deflateRaw: (data: Uint8Array) =>
            new Uint8Array(zlib.deflateRawSync(Buffer.from(data))),
        inflateRaw: (data: Uint8Array) =>
            new Uint8Array(zlib.inflateRawSync(Buffer.from(data))),
    },
    abiProvider: {
        getAbi: getCacheAbi
    },
}

interface ExpiringABIDef {
    abiDef: ABIDef | undefined
    age: number
}

const abiCache = new Map<string, ExpiringABIDef>()
const pendingAbis = new Map<string, Promise<API.v1.GetAbiResponse>>()
const maxAge = 1000 * 60

export async function getCacheAbi(account: Name) {
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
