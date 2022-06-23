import { Checksum256Type } from '@greymass/eosio'

// API Configuration for the cosigner to talk with EOSIO
//      These should be base level URLs (https://eos.greymass.com)
export interface APIConfig {
    // API Client - basic node
    api_default: string
    // API Client - sampler node
    api_sampler: string
    // The chain_id for this chain
    chain_id: Checksum256Type
    // System Token
    system_token: string
}

export interface ServerConfig {
    // Port the cosigner API runs on
    port: string
}