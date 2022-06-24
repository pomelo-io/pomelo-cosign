import {
    Transaction,
} from '@greymass/eosio'
import { getCacheAbi } from './esr';

export async function validateTransaction(trx: Transaction): Promise<Boolean> {

    for( const action of trx.actions ) {
        // allow all actions for contracts
        if (['app.pomelo', 'login.eosn', 'd.app.pomelo', 'd.login.eosn'].includes(action.account.toString())) continue;

        // allow transfers to accounts
        if (action.name.toString() == 'transfer') {
            const abi = await getCacheAbi(action.account)
            const decoded = action.decodeData(abi) as any;
            if (['app.pomelo', 'd.app.pomelo'].includes(decoded['to']?.toString())) continue;
        }
        return false;
    }

    return true
}
