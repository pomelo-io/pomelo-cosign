import express from "express";
import {
    Name,
    PermissionLevel,
    PrivateKey,
} from '@greymass/eosio'

import { cosignTransaction } from './utils/cosign'
import { prependNoopAction } from './utils/noop'
import { parseRequest } from './utils/parse'

import { client, PORT, COSIGN_ACCOUNT, COSIGN_PERMISSION, COSIGN_PRIVATE_KEY } from './config'
import {
    Cosigner
} from './types'


const defaultCosigner: Cosigner = {
    account: Name.from(COSIGN_ACCOUNT),
    permission: Name.from(COSIGN_PERMISSION),
    private: PrivateKey.from(COSIGN_PRIVATE_KEY)
}

export function getCosigner(): Cosigner {
    return {
        ...defaultCosigner,
        public: defaultCosigner.private.toPublic(),
    }
}


/*
curl -XGET 'localhost:8080/cosign_trx' \
    -H 'content-type: application/json' \
    -d '{"ref":"pomelo","request":"esr://gmNgZGA4cCSk8aVELwMQHHj56AqjgFPBxRzxs2dBAiveGhkJGhiGNggotmkgywAA","signer":{"actor":"tralivali111","permission":"active"}}'
*/
const app = express();

app.use(express.json());

app.get( "/cosign_trx", async ( req, res ) => {

    const { body } = req;
    if (!body) {
        return res.status(400).json( 'Provide body payload' );
    }

    try {
        // Process the body of the request
        const request = await parseRequest(body)
        if (!request) {
            const message = 'Transaction not supplied in resource request. Either request, transaction, or packedTransaction must be specified in the request.'
            return res.status(400).json(message)
        }

        if (!body.signer) {
            const message = 'Signer not supplied in resource request. The signer property must be specified in the request.'
            return res.status(400).json(message)
        }

        const signer = PermissionLevel.from(body.signer)

        // Load required ABIs for transaction
        const abis = await request.fetchAbis()

        // Generate tapos values for transaction
        const info = await client.v1.chain.get_info()
        const header = info.getTransactionHeader(300) // 300 = seconds this cosigned transaction is valid for

        // Resolve the signing request
        const resolved = request.resolve(abis, signer, header)

        // TODO: make sure resolved.transaction.actions contains only valid POMELO actions

        const cosigner = getCosigner()

        // Modify the resolved transaction to append the cosigning action
        const modified = prependNoopAction(resolved.transaction, cosigner)

        const {
            result,
            signatures,
            transaction,
        } = await cosignTransaction(cosigner, modified)

        // Serve the resulting transaction and signature
        res.statusCode = 200
        res.end(
            JSON.stringify({
                code: 200,
                data: {
                    request: result.data.req,
                    signatures,
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
    console.log( `server started at http://localhost:${ PORT }` );
} );