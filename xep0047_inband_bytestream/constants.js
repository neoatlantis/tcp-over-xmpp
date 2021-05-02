const { xml } = require("@xmpp/client");

function cancelling_error(name){
    return xml(
        "error",
        { type: "cancel" },
        xml(name, { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas" })
    )
}


module.exports = {
    ACCEPT_TIMEOUT: 30 * 1000,
    IBBNS: 'http://jabber.org/protocol/ibb',

    STANZA_IBB_REFUSAL: cancelling_error("not-acceptable"),
    STANZA_IBB_NOTFOUND: cancelling_error("item-not-found"),
    STANZA_IBB_BADREQUEST: cancelling_error("bad-request"),

};
