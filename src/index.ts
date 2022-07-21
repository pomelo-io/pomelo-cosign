import express from "express";
const cors = require('cors');

import {
    cosignTransaction,
    prependNoopAction,
    parseRequest,
    validateTransaction,
} from './cosign'

import { PORT } from './config'

const app = express();

app.use(express.json());
app.use(cors());

app.post( "/cosign", async ( req, res ) => {
    try {
        const { body } = req;
        if (!body) throw 'Provide body payload';

        // parse request body
        const transaction = await parseRequest(body)
        if (!transaction) throw 'Transaction not supplied in resource request.'

        // allow only valid POMELO actions
        if (!await validateTransaction(transaction)) throw 'Transaction contains not allowed actions.'

        // prepend actions with noop action
        const modifiedTrx = prependNoopAction(transaction)

        // sign the transaction
        const signature = await cosignTransaction(modifiedTrx)

        // Serve the resulting transaction and signature
        res.status(200).json({
            code: 200,
            data: {
                transaction: modifiedTrx,
                signatures: [ signature ],
            },
        })
    }
    catch (err) {
        console.log('🛑 Failed to cosign transaction. Error: ', err.message ?? err)
        return res.status(400).json({ error: err.message ?? err })
    }
} );

app.listen( PORT, () => {
    console.log( `🚀 server started on port ${ PORT }` );
} );