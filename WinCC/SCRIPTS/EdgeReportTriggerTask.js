export function Task_EdgeReportTriggerTask_Update() {

    //START HERE
    // read trigger signal from app
    let rpcRequestReady = Number(Tags("rpc_request_status").Read());
    HMIRuntime.Trace("RPC_REQUEST READY " + rpcRequestReady);

    if (rpcRequestReady == 1) {
        // create report based on trigger tag name
        CreateReport("TriggerTag1");
    }
    else if (rpcRequestReady == 2) {
        let reportFileName = Tags("ReportFilenameTag").Read();
        HMIRuntime.Trace("REPORT FILENAME " + reportFileName);
        ReportToPDF(reportFileName);
    }

}