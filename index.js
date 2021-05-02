const fs = require("fs");
const config = JSON.parse(fs.readFileSync(process.argv[2]));
const XMPPInbandBytestreamEndpoint = require("./xep0047_inband_bytestream");
const net = require("net");
const { client, xml } = require("@xmpp/client");


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const xmpp = client({
    service: config.xmpp.service,
    username: config.xmpp.username,
    password: config.xmpp.password,
    resource: "tmpp",
});
const peer = config.xmpp.peer;
const role = config.role;
const ibb_endpoint = new XMPPInbandBytestreamEndpoint(xmpp);


function build_pipe(a, b){
    a.pipe(b);
    b.pipe(a);

    a.on("error", function(e){
        console.log("bytestream error", e);
        a.unpipe(b);
        a.destroy();
    });
    b.on("error", function(e){
        console.log("socket error", e);
        b.unpipe(a);
        b.destroy();
    });
}



if(role == "server"){
    ibb_endpoint.on("bytestream", function(bytestream){
        if(role == "server"){
            bytestream.accept();
            forward_bytestream(bytestream);
        } else {
            bytestream.reject();
        }
    });

    function forward_bytestream(bytestream){
        const socket = new net.Socket();
        socket.connect(config.tcp.port, config.tcp.host);
        build_pipe(bytestream, socket);
    }
}

if(role == "client"){
    const local_server = net.createServer(async function(socket){
        const bytestream = await ibb_endpoint.create(peer);
        build_pipe(bytestream, socket);
    });

    local_server.listen(config.tcp.port, config.tcp.host);
}


xmpp.on('stanza', (stanza)=>{
    console.log("INCOMING STANZA --- ", stanza.toString());
});

xmpp.on("online", async ()=>{
    await xmpp.send(xml("presence"));
});

xmpp.start();
console.log("XMPP start.");
