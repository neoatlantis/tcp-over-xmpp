module.exports = class Debug {
    _join(e){
        return Object.values(e).join(" ").trim();
    }
    _indent(t){
        let tl = t.split("\n").map((l)=>"\t"+l);
        return tl.join("\n");
    }

    log (){
        console.log(this._join(arguments));
    }

    remote (){
        const text = this._indent(this._join(arguments));
        console.log('\x1b[33m%s\x1b[0m', text);  //yellow
    }

    local (){
        const text = this._indent(this._join(arguments));
        console.log('\x1b[32m%s\x1b[0m', text);  // green
    }



}
