const fs = require("fs");
const config = JSON.parse(fs.readFileSync(process.argv[2]));



const TCPLayer = require("./tcp_layer");
const XMPPLayer = require("./xmpp_layer");


// role: TCP role is inversed with program role. When program acts as server,
// it connects to outer service as client. Vice versa.
const tcp = new TCPLayer(
    (config.role == "server" ? "client" : "server"),
    config.tcp.host,
    config.tcp.port
);
const xmpp = new XMPPLayer(config.xmpp);



xmpp.on("data", function({ id, data }){
});

tcp.on("data", function({ id, data }){
    xmpp.on_socket_data({ id, data });
});
