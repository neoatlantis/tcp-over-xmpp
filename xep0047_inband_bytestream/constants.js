const { xml } = require("@xmpp/client");
module.exports = {
    IBBNS: 'http://jabber.org/protocol/ibb',

    STANZA_IBB_REFUSAL: xml(
        "error",
        { type: "cancel" },
        xml("not-acceptable", { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas" })
    )


};
