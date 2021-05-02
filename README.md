TCP Bytestream over XMPP
====================

This tool provides a novel method of accessing Internet behind firewall. TCP
proxy providers can serve over the XMPP federation network. This should add
some more work for censorship powers. But beyond that, this tool will also
connect any computers capable of accessing the XMPP network together, building
up decentralized, cross-computer data channels for multiple purposes.

TCP bytestream is transmitted using XEP-0047 (In-band bytestream). This XEP
implementation may also be separated for other use, e.g. transmission of images
for a chat program, etc.

This tool have 2 roles: a client and a server. However, both of them are
clients in terms of XMPP protocol. "server" only means forwarding and "client"
backwarding data stream to another program or free Internet.

###  Usage

First, write a config file:

```json
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
```

Then run:

`node index.js config.json`

Tell node to run this script as (1)"client" or (2)"server" in config file.
Depending on this setting, "tcp" section means either (1) a listening port to
which new TCP connections are made, or (2) the target host:port to which TCP
traffic will be forwarded to.

Currently only JID with "/tmpp" are supported (and required). No service
discoveries.

### To be done...

1. Insert a ephemeral TLS socket between TCP and XMPP stream, to build up
confidential and PFS-enabled transmission for enhanced security.
2. Data compression?
