const { client, xml } = require("@xmpp/client");
const events = require("events");
const XMPPInbandBytestreamEndpoint = require("./xep0047_inband_bytestream");

const IBBNS = 'http://jabber.org/protocol/ibb';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


class XMPPLayer extends events.EventEmitter {

    constructor (options){
        super();

        this.xmpp = client({
            service: options.service,
            username: options.username,
            password: options.password,
            resource: "tmpp",
        });
        this.peer = options.peer;

        this.bytestreamEndpoint = new XMPPInbandBytestreamEndpoint(this.xmpp);
        this.bind_events();

        this.xmpp.start();
    }


    bind_events(){
        const self = this;
        this.xmpp.on("online", async ()=>{
            await this.xmpp.send(xml("presence"));
        });

        this.bytestreamEndpoint.on("bytestream", function(bytestream){
            console.log("Remote bytestream request. Accept.");
            bytestream.accept();
            //bytestream.reject();

            bytestream.on("data", function(e){
                console.log("----- server recv -----", e);
            });

        });

        this.xmpp.on('stanza', (stanza)=>{
            console.log("INCOMING STANZA --- ", stanza.toString());
        });

        this.xmpp.on("error", console.error);
    }


    async on_socket_data ({id, data}){
        /*const stanza = xml(
            "iq",
            { to: this.peer, type: "set", id: id },
            xml(
                "open",
                { xmlns: IBBNS },
            )
        );
        console.log("OUTGOING STANZA --- ", stanza.toString());
        await this.xmpp.send(stanza);*/
        const bytestream = await this.bytestreamEndpoint.create(this.peer);
        bytestream.on("open", function(){
            console.log("Outgoing bytestream opened.");
            bytestream.end();
        });
    }

}









module.exports = XMPPLayer;
