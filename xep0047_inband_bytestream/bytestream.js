const { client, xml } = require("@xmpp/client");
const stream = require("stream");
const constants = require("./constants");
const Debug = require("./debug");

const debug = new Debug();


class XMPPInbandBytestream extends stream.Duplex {

    constructor (endpoint, options){
        super();

        this.id = options.id;
        this.peer = options.peer;
        this.endpoint = endpoint;

        this.local_accepted  = options.local_accepted;
        this.local_pending   = options.local_pending;
        this.remote_accepted = options.remote_accepted;
        this.remote_pending  = options.remote_pending;

        this.send_seq = 0;
        this.recv_seq = 0;

        if(this.local_pending){
            setTimeout(()=>this._decide(), constants.ACCEPT_TIMEOUT);
        }

        if(this.remote_pending){
            setImmediate(()=>this._send_open());
            setTimeout(()=>{
                if(this.remote_pending){
                    this.emit("error", "connection request time out");
                }
                this.remote_pending = false;
            }, constants.ACCEPT_TIMEOUT);
        }

    }

    _decide(result){
        if(!this.local_pending) return;
        if(result !== undefined) this.local_accepted = result;
        this.local_pending = false;
        if(this.local_accepted){
            debug.log("Accepted connection [" + this.id + "] from " + this.peer);
            return this.emit("open");
        }
        this.emit("denied", "connection refused by local policy");
    }

    accept(){
        this._decide(true);
    }

    reject(){
        this._decide(false);
    }

    async _send_open(){
        // send open request to peer
        const stanza = xml(
            "iq",
            { to: this.peer, type: "set", id: this.id },
            xml(
                "open",
                {
                    xmlns: constants.IBBNS,
                    "block-size": "65535",
                    sid: this.id,
                    stanza: "iq",
                }
            )
        );
        debug.local(stanza.toString());
        let result = null;
        try{
            result = await this.endpoint.client.iqCaller.request(stanza);
            debug.remote(result.toString());
            this.remote_accepted = true;
            setImmediate(()=>this.emit("open"));
            debug.log("Remote accepted.");
        } catch(e){
            debug.remote(e.toString());
            this.remote_accepted = false;
            setImmediate(()=>
                this.emit("denied", "connection refused by remote peer"));
        } finally {
            this.remote_pending = false;
        }
        return result;
    }


    async _wait_ready(){
        if(
            !this.local_pending && !this.remote_pending
        ){
            if(this.local_accepted && this.remote_accepted){
                return;
            } else {
                this.emit("error", "Bytestream " + this.id + " is refused.");
            }
        }
        return new Promise((resolve, reject)=>{
            this.once("open", resolve);
            this.once("denied", reject);
        });
    }


    _write(chunk, encoding, callback){
        const self = this;
        (async function(){
            await self._wait_ready();
            console.log("Send chunk to", self.peer);
            const stanza = xml(
                "iq",
                { to: self.peer, type: "set" },
                xml(
                    "data",
                    {
                        xmlns: constants.IBBNS,
                        sid: self.id,
                        seq: (self.send_seq++),
                    },
                    chunk.toString("base64"),
                )
            );
            debug.local(stanza.toString());
            self.endpoint.client.iqCaller.request(stanza);
            callback();
        })()
    }


    async _receive(seq, chunk){
        await this._wait_ready();
        if(seq != (this.recv_seq++)){
            console.warn("Recv seq id error:", seq, this.recv_seq-1);
        }
        this.push(Buffer.from(chunk, "base64"));
    }

    _read(){ }

    _final(callback){
        const self = this;
        (async function(){
            const stanza = xml(
                "iq",
                { to: self.peer, type: "set" },
                xml(
                    "close",
                    {
                        xmlns: constants.IBBNS,
                        sid: self.id,
                    }
                )
            );
            debug.local(stanza.toString());
            await self.endpoint.client.iqCaller.request(stanza);
            console.log("***************************");
            callback();
        })();
    }

}


module.exports = XMPPInbandBytestream;
