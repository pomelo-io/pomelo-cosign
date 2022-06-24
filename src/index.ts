import express from "express";
const cors = require('cors');
import {
    Name,
    PermissionLevel,
    PrivateKey,
} from '@greymass/eosio'

import { cosignTransaction } from './utils/cosign'
import { prependNoopAction } from './utils/noop'
import { parseRequest } from './utils/parse'
import { validateTransaction } from './utils/validate'
import { Cosigner } from './types'

import {
    PORT,
    COSIGN_ACCOUNT,
    COSIGN_PERMISSION,
    COSIGN_PRIVATE_KEY,
} from './config'


const POMELO_COSIGNER: Cosigner = {
    account: Name.from(COSIGN_ACCOUNT),
    permission: Name.from(COSIGN_PERMISSION),
    private: PrivateKey.from(COSIGN_PRIVATE_KEY),
    public: PrivateKey.from(COSIGN_PRIVATE_KEY).toPublic(),
}


/*
curl -POST 'localhost:8080/cosign_trx' \
    -H 'content-type: application/json' \
    -d '{"ref":"pomelo","request":"esr://gmNgZGA4cCSk8aVELwMQHHj56AqjgFPBxRzxs2dBAiveGhkJGhiGNggotmkgywAA","signer":{"actor":"myaccount","permission":"active"}}'
*/
const app = express();

app.use(express.json());
app.use(cors());

app.post( "/cosign_trx", async ( req, res ) => {

    const { body } = req;
    if (!body) {
        return res.status(400).json( 'Provide body payload' );
    }

    // Process the body of the request
    const transaction = await parseRequest(body)
    if (!transaction) {
        const message = 'Transaction not supplied in resource request. Either request, transaction, or packedTransaction must be specified in the request.'
        return res.status(400).json(message)
    }

    if (!body.signer) {
        const message = 'Signer not supplied in resource request. The signer property must be specified in the request.'
        return res.status(400).json(message)
    }

    // allow only valid POMELO actions
    if (!validateTransaction(transaction)) {
        const message = 'Transaction contains not allowed actions.'
        return res.status(400).json(message)
    }

    try {

        // prepend actions with noop action
        const modified = prependNoopAction(transaction, POMELO_COSIGNER)

        // sign the transaction
        const cosigned = await cosignTransaction(POMELO_COSIGNER, modified)

        // Serve the resulting transaction and signature
        res.statusCode = 200
        res.end(
            JSON.stringify({
                code: 200,
                data: {
                    transaction: cosigned.transaction,
                    signatures: cosigned.signatures,
                },
            })
        )
    }
    catch (err) {
        console.log('🛑 Failed to cosign. Error: ', err.message)
        return res.status(400).json({ error: err.message })
    }
} );

app.listen( PORT, () => {
    console.log( `🚀 server started on port ${ PORT }` );
} );