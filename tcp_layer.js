const net = require("net");
const crypto = require("crypto");
const events = require("events");


async function random_id(){
    const b = Buffer.alloc(16);
    await new Promise((resolve)=>crypto.randomFill(b, resolve));
    return b.toString("hex");
}


class SelfManagedSocket extends events.EventEmitter{
    
    constructor (socket_id, socket){
        super();
        const self = this;

        this.socket = socket;
        this.socket.id = socket_id;

        this.socket.on("data", function(data){
            self.emit("data", { id: socket_id, data: data });
        });

        this.socket.on("error", ()=>self.clean_exit(self));
        this.socket.on("end", ()=>self.clean_exit(self));
    }

    write(buffer){
        if(this.socket.destroyed) return;
        this.socket.write(buffer);
    }

    clean_exit (self){
        try{
            self.socket.removeAllListeners();
        } catch(e){
        }
        try{
            self.socket.destroy();
        } catch(e){
        }
        try{
            self.emit("remove");
        } catch(e){
        }
    }

}




class TCPLayer extends events.EventEmitter{

    constructor(role, host, port){
        super();
        const self = this;
        this.sockets = {};
        this.role = role;

        if(role == "server"){
            this.init_as_server(host, port);
        } else {
            this.init_as_client(host, port);
        }
    }

    init_as_server(host, port){
        /* Initialize as an incoming TCP server on a "client" endpoint. Traffic
         * from TCP layer is forwarded to XMPP. */
        const self = this;
        console.log("TCP server being initialized at ", host, ":", port);

        this.local_server = net.createServer(async function(socket){
            const id = await random_id();
            self.register_socket(id, new SelfManagedSocket(id, socket));
        });

        this.local_server.listen(port, host);
    }

    init_as_client(host, port){
        /* Initialize as an outgoing TCP client on a "server" endpoint. Traffic
         * from XMPP layer is forwarded to (host:port) */
        const self = this;
        console.log("TCP client forwarding data to ", host, ":", port);

        this.create_client_socket = async function create_socket(id){
            const socket = new net.Socket();
            self.register_socket(id, new SelfManagedSocket(id, socket));
            await new Promise((resolve, reject)=>{
                socket.connect(port, host, (err)=>{
                    if(err) return reject(err);
                    resolve();
                });
            });
        }
    }

    register_socket(socket_id, socket){
        /* Take care of the newly created SelfManagedSocket:
         * - on its remove event, remove registration
         * - collect its data emissions */
        const self = this;
        self.sockets[socket_id] = socket;
        socket.on("remove", ()=>{
            if(!self.sockets[socket_id]) return;
            self.sockets[socket_id].removeAllListeners();
            delete self.sockets[socket_id];
            console.log("socket removed:", socket_id);
        });
        self.sockets[socket_id].on("data", ({ id, data })=>{
            self.emit("data", { id, data });
        });
        
    }

    async on_xmpp_data({ id, data }){
        /* Intended to be called from XMPP layer */

        if(this.sockets[id] == undefined){
            // what do if new id from XMPP occurs:
            // - for a 'client' mode TCP layer, create new outgoing connection
            // - for a 'server' mode TCP layer, ignore unknown data
            if(this.create_client_socket !== undefined){
                await this.create_client_socket(id);
            } else {
                return;
            }
        }
        //socket.write(data);
    }
}






module.exports = TCPLayer;
