
function ProtoItem() {
    this.protoName = "";
    this.protoTag = "";//标签 Req|Ack|Ntf
    this.params = [];
    this.isNtf = false;//是否是推送
    this.hasAck = false;//是否有返回数据
}

ProtoItem.prototype.decodeParam = function (content) {
    let result = [];
    let reg = /(repeated|optional|required)?\s*(int32|string|[A-Z][a-zA-Z]+)\s+([a-zA-Z]+)\s+\=\s+\d+/g;
    let arr = reg.exec(content);
    while (arr) {
        let param = new ParamItem();
        let type = arr[2];
        if (type == "int32") type = "number";
        let tag = arr[1];
        if (tag == "repeated") type += "[]";
        param.paramTag = tag;
        param.paramType = type;
        param.paramName = arr[3];
        arr = reg.exec(content);
        result.push(param);
    }
    this.params = result;
}
ProtoItem.prototype.initFunctionName = function () {
    let funcName = this.protoName.charAt(0).toLocaleUpperCase() + this.protoName.substr(1);
    if (this.isNtf) {
        this.functionName = "update" + funcName + this.protoTag;
    } else {
        this.functionName = this.protoTag.charAt(0).toLocaleLowerCase() + this.protoTag.substr(1) + funcName;
    }
}

function ParamItem() {
    this.paramTag = "";
    this.paramType = "";
    this.paramName = "";
}

module.exports = ProtoItem;

