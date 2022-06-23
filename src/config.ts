import * as dotenv from "dotenv"
import {APIClient, FetchProvider} from '@greymass/eosio'

import fetch from 'node-fetch';
;(global as any).fetch = fetch;

dotenv.config();

export const PORT = process.env.NODEOS_ENDPOINT ?? 8080
export const CHAIN_ID = '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840'
export const NODEOS_ENDPOINT = process.env.NODEOS_ENDPOINT ?? "https://eos.eosn.io"

export const COSIGN_ACCOUNT = 'cosigncosign'
export const COSIGN_PERMISSION = 'cosigncosign'
export const COSIGN_PRIVATE_KEY = process.env.COSIGN_PRIVATE_KEY

if (!process.env.COSIGN_PRIVATE_KEY) throw new Error("[COSIGN_PRIVATE_KEY] is required");

export const MAX_CPU_USAGE_MS = 5


// API Client - basic node
export const provider = new FetchProvider(NODEOS_ENDPOINT, {fetch})
export const client = new APIClient({provider})