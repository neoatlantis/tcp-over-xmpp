const { client, xml } = require("@xmpp/client");
const stream = require("stream");
const events = require("events");
const constants = require("./constants");
const XMPPInbandBytestream = require("./bytestream");



const ACCEPT_TIMEOUT = 30;













class XMPPInbandBytestreamEndpoint extends events.EventEmitter {

    constructor (client){
        super();
        const self = this;

        this.client = client;

        // we got remote request on a new stream
        client.iqCallee.set(constants.IBBNS, "open", async (ctx)=>{
            const bytestream = new XMPPInbandBytestream(this, {
                peer: ctx.to.toString(),
                id: ctx.stanza.attrs.id, // remote specified id
                remote_pending: false,
                remote_accepted: true,
                local_pending: true,
                local_accepted: false,
            });
            setImmediate(()=>self.emit("bytestream", bytestream));

            console.log("New remote bytestream, waiting approval.");
            return new Promise((resolve, reject)=>{
                bytestream.once("open", ()=>resolve(true));
                bytestream.once(
                    "denied",
                    (e)=>resolve(constants.STANZA_IBB_REFUSAL)
                );
            });
        });

    }


    async create(peer){
        const bytestream = new XMPPInbandBytestream(this, {
            peer: peer,
            id: "local-new-id", // TODO randomize
            remote_pending: true,
            remote_accepted: false,
            local_pending: false,
            local_accepted: true,
        });

        return bytestream;
    }

}

module.exports = XMPPInbandBytestreamEndpoint;
