const { client, xml } = require("@xmpp/client");
const stream = require("stream");
const events = require("events");
const constants = require("./constants");
const crypto = require("crypto");
const XMPPInbandBytestream = require("./bytestream");

const Debug = require("./debug");
const debug = new Debug();


async function random_id(){
    const b = Buffer.alloc(16);
    await new Promise((resolve)=>crypto.randomFill(b, resolve));
    return b.toString("hex");
}



class XMPPInbandBytestreamEndpoint extends events.EventEmitter {

    constructor (client){
        super();
        const self = this;

        this.client = client;
        this.bytestreams = {};

        // we got remote request on a new stream
        client.iqCallee.set(constants.IBBNS, "open", async (ctx)=>{
            const sid = ctx.stanza.attrs.id;
            if(!sid || self.bytestreams[sid] !== undefined){
                // refuse open if it's already opened.
                return constants.STANZA_IBB_REFUSAL;
            }

            const bytestream = new XMPPInbandBytestream(this, {
                peer: ctx.from.toString(),
                id: sid,  // remote specified id
                remote_pending: false,
                remote_accepted: true,
                local_pending: true,
                local_accepted: false,
            });
            setImmediate(()=>self.emit("bytestream", bytestream));
            self.bytestreams[sid] = bytestream;

            console.log("New remote bytestream, waiting approval.");
            return new Promise((resolve, reject)=>{
                bytestream.once("open", ()=>resolve(true));
                bytestream.once(
                    "denied",
                    (e)=>resolve(constants.STANZA_IBB_REFUSAL)
                );
            });
        });

        // handle request with data payloads
        client.iqCallee.set(constants.IBBNS, "data", async (ctx)=>{
            const seq = ctx.element.attrs.seq;
            const sid = ctx.element.attrs.sid;
            if(self.bytestreams[sid] === undefined){
                return constants.STANZA_IBB_NOTFOUND;
            }
            try{
                await self.bytestreams[sid]._receive(seq, ctx.element.text());
            } catch(e){
                debug.log(e);
                return constants.STANZA_IBB_BADREQUEST;
            }
            return true;
        });

        // handle close events
        client.iqCallee.set(constants.IBBNS, "close", async (ctx)=>{
            const sid = ctx.element.attrs.sid;
            if(self.bytestreams[sid] === undefined){
                return constants.STANZA_IBB_NOTFOUND;
            }
            try{
                await self.bytestreams[sid].end();
                debug.log("Bytestream " + sid + " closed.");
            } catch(e){
                debug.log(e);
            }
            return true;
        });

    }


    async create(peer){
        if(!peer) throw Error("peer required");

        const id = await random_id();
        const bytestream = new XMPPInbandBytestream(this, {
            peer: peer,
            id: id,
            remote_pending: true,
            remote_accepted: false,
            local_pending: false,
            local_accepted: true,
        });

        this.bytestreams[id] = bytestream;
        return bytestream;
    }

}

module.exports = XMPPInbandBytestreamEndpoint;
