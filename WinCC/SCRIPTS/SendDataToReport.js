export function SendDataToReport(request) {

    // extract request parameters
    let loggingTags = request.Params.LTags;
    let realtimeTags = request.Params.RTags;
    //HMIRuntime.Trace("ltags______" + ltags);
    // scale time based on timezone
    let tzMin = Number(new Date(request.Params.From).getTimezoneOffset());
    let tStart = new Date(request.Params.From + 1000 * 60 * tzMin);
    let tEnd = new Date(request.Params.To + 1000 * 60 * tzMin);
    let bv = request.Params.BoundVal ? request.Params.BoundVal : false;
    let alarmsEnabled = request.Params.Alarms;
    let id = request.Id;

    HMIRuntime.Trace("Starting send data...");
    //HMIRuntime.Trace("startTZ__" +  + "__endTZ__" + tEnd.getTimezoneOffset());
    HMIRuntime.Trace("starttoloc__" + tStart.toLocaleString() + "__endtoloc__" + tEnd.toLocaleString());

    GenerateReportData(loggingTags, realtimeTags, tStart, tEnd, bv, alarmsEnabled, id).then((data) => {
        // send data to pipe
        HMIRuntime.FileSystem.AppendFile("/tmp/siemens/automation/HmiHistory", data, "utf8").then(() => {
            HMIRuntime.Trace("Response written to file!");
            // empty request
            for (let rIndex = 0; rIndex < 101; rIndex++) {
                Tags("rpc_request[" + rIndex + "]").Write("");
            }
            // send ready response to app
            Tags("rpc_response").Write("1");
            // turn off request from app
            Tags("rpc_request_status").Write("0");
        }).catch((error) => {
            HMIRuntime.Trace("Error writing to file " + error);
            Tags("rpc_response").Write("0");
        });
    });

}