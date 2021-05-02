TCP Bytestream over XMPP
====================

This tool provides a novel method of accessing Internet behind firewall. TCP
proxy providers can serve over the XMPP federation network. This should add
some more work for censorship powers.

TCP bytestream is transmitted using XEP-0047 (In-band bytestream). This
implementation may also be separated for other use, e.g. transmission of
images, etc.

This tool have 2 parts: a client and a server. However, both of them are
clients in terms of XMPP protocol. "server" only means forwarding and "client"
backwarding data stream to another program or free Internet. A client may also
forward TCP data stream to different server XMPP accounts to obfuscate some
traffic analysis.

###  Usage

First, write a config file:

`
{
    "role": "client", // or "server"
    "xmpp": {
        "username": "client",
        "service": "xmpp://localhost:5222",
        "password": "testpassword",
        "resource": "tmpp",
        "peer": "server@localhost/tmpp"
    },

    "tcp": {
        "host": "127.0.0.1",
        "port": 10000
    }
}
`

Then run:

`node index.js config.json`

Tell node to run this script as (1)"client" or (2)"server" in config file.
Depending on this setting, "tcp" section means either (1) a listening port to
which new TCP connections are made, or (2) the target host:port to which TCP
traffic will be forwarded to.

Currently only JID with "/tmpp" are supported (and required). No service
discoveries.
