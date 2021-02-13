export function CreateReport(triggerTagName) {

    // reset trigger
    Tags(triggerTagName).Write(false);

    // read the request query from chunked array and reconstruct string
    let requestStr = "";
    for (let rIndex = 0; rIndex < 99; rIndex++) {
        let rpcRequest = Tags("rpc_request[" + rIndex + "]").Read();
        HMIRuntime.Trace("RPC_REQUEST " + rIndex + ": " + rpcRequest);
        if (rpcRequest != "") {
            requestStr += rpcRequest;
        }
        else {
            break;
        }
    }

    HMIRuntime.Trace("RPC_REQUEST FINAL " + requestStr);
    if (requestStr == "") {
        // if request string is empty exit
        return
    }

    // parse request to objects
    let request = JSON.parse(requestStr);

    try {
        switch (request.Command) {
            // if request contains command taglogging.read
            case "TagLogging.Read": SendDataToReport(request);
                break;
        }
    } catch (err) {
        // else raise error
        let response = {
            Id: request.Id,
            Error: { "Code": -1, "Text": err.toString() }
        };
        Tags.Item("rpc_response").Write(JSON.stringify(response));
    }

}