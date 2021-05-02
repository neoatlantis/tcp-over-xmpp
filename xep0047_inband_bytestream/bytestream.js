const { client, xml } = require("@xmpp/client");
const stream = require("stream");
const events = require("events");
const constants = require("./constants");


const ACCEPT_TIMEOUT = 30;





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

        if(this.local_pending){
            setTimeout(()=>this._decide(), ACCEPT_TIMEOUT * 1000);
        }

        if(this.remote_pending){
            setImmediate(()=>this._send_open());
            setTimeout(()=>{
                if(this.remote_pending){
                    this.emit("error", "connection request time out");
                }
                this.remote_pending = false;
            }, ACCEPT_TIMEOUT * 1000);
        }

    }

    _decide(result){
        if(!this.local_pending) return;
        if(result !== undefined) this.local_accepted = result;
        this.local_pending = false;
        if(this.local_accepted){
            console.log("Accepted connection [" + this.id + "] from " + this.peer);
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
        console.log(stanza.toString());
        let result = null;
        try{
            result = await this.endpoint.client.iqCaller.request(stanza);
            console.log(">>>", result.toString());
            this.emit("open");
        } catch(e){
            console.log(">>>", e.toString());
            this.emit("denied", "connection refused by remote peer");
        } finally {
            this.remote_pending = false;
        }
        return result;
    }
}


module.exports = XMPPInbandBytestream;
