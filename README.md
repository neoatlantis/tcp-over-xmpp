TCP Proxy over XMPP
====================

This tool provides a novel method of accessing Internet behind firewall. TCP
proxy providers can serve over the XMPP federation network. This should add
some more work for censorship powers.

This tool have 2 parts: a client and a server. However, both of them are
clients in terms of XMPP protocol. "server" only means forwarding and "client"
backwarding data stream to another program or free Internet. A client may also
forward TCP data stream to different server XMPP accounts to obfuscate some
traffic analysis.
