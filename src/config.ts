import * as dotenv from "dotenv"
import {
    APIClient,
    FetchProvider,
    Name,
    PrivateKey,
} from '@greymass/eosio'

import {
    Cosigner,
} from './types'

import fetch from 'node-fetch';

dotenv.config();

export const PORT = 8080
export const CHAIN_ID = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
export const NODEOS_ENDPOINT = process.env.NODEOS_ENDPOINT || "https://eos.eosn.io"

export const COSIGN_ACCOUNT = process.env.COSIGN_ACCOUNT || 'cpu.pomelo'
export const COSIGN_PERMISSION = process.env.COSIGN_PERMISSION || 'cosign'
export const COSIGN_CONTRACT = process.env.COSIGN_CONTRACT || 'cpu.pomelo'
export const COSIGN_PRIVATE_KEY = process.env.COSIGN_PRIVATE_KEY

if (!process.env.COSIGN_PRIVATE_KEY) throw new Error("[COSIGN_PRIVATE_KEY] is required");

export const POMELO_COSIGNER: Cosigner = {
    account: Name.from(COSIGN_ACCOUNT),
    permission: Name.from(COSIGN_PERMISSION),
    private: PrivateKey.from(COSIGN_PRIVATE_KEY)
}

export const MAX_CPU_USAGE_MS = 20

// API Client - basic node
const provider = new FetchProvider(NODEOS_ENDPOINT, {fetch})
export const client = new APIClient({provider})