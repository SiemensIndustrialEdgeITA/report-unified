
//Import Modulues
const fs = require('fs');
const carbone = require('carbone');
const ConnectRuntime = require('./Bindings/njs/opn.js');  /*import Comfort api*/
const { configTemplate } = require('./baseConfig.js');
const { mountShare, unmountShare } = require('./winShare.js');

//Set globals for WinCC data stream
const HISTORY_PATH = "/tmp/siemens/automation/HmiHistory";
const configPath = "/cfg-data/"
const configFile = configPath + 'config.json';
var stream = null;
var reportdatajson = {};
var receivedBuffer = [];
const ETX = String.fromCharCode(3);


// START
console.dir('[INFO] - Start Reporting Tool...');

// Import Report Configuration 
if (!fs.existsSync(configFile)) {
    // create it if not exiat
    fs.writeFileSync(configFile, JSON.stringify(configTemplate));
}
// get config data
const rawconfig = fs.readFileSync(configFile);
const configData = JSON.parse(rawconfig);
const storagePortConfig = configData.storagePortConfig;
const triggerTagConfig = configData.triggerTagConfig;
const startTimeTag = configData.startTimeTag;
const endTimeTag = configData.endTimeTag;
const templateFilenameTag = configData.templateFilenameTag;
const reportFilenameTag = configData.reportFilenameTag;
const triggerDeleteReports = configData.triggerDeleteReports;
const alarmsEnabled = configData.alarms;

// set globals for tags
var loggingTagsToRead = [];   // Array of requested logging tags
var tagsToRead = [];   // Array of requested single tags

loggingTagsToRead = configData.loggingTags;
tagsToRead = configData.tags;

// set globals for report
var endTimeQuery = new Date().getTime();
var startTimeQuery = endTimeQuery - (1000 * 60 * 60);
var reportTemplateFile = "";
var templateIsConfigured = false;
var reportStoragePath = "";
const templateRegex = /(.xlsx|.xml|.xhtml|.odt|.ods|.odp|.docx|.pptx|.XLSX|.XML|.xHTML|.ODT|.ODS|.ODP|.DOCX|.PPTX|)$/;
const reportRegex = /(.xlsx|.xml|.xhtml|.odt|.ods|.odp|.docx|.pptx|.pdf|.XLSX|.XML|.xHTML|.ODT|.ODS|.ODP|.DOCX|.PPTX|.PDF|)$/;

// Define query for rpc request
// LTags define the logging variables
// The Date will be From and To date for the logged tags
var query = {
    "Params": {
        "LTags": loggingTagsToRead,
        "RTags": tagsToRead,
        "From": startTimeQuery,
        "To": endTimeQuery,
        "BoundVal": false,
        "Alarms": alarmsEnabled
    },
    "Command": "TagLogging.Read"
}

// Windows Shared Folder setup
const sharedLocalFolder = "/mnt/winshare";
const sharedEnabled = configData.share.enabled;
if (sharedEnabled) {
    // call mountShare wrapper
    mountShare(configData.share.sharedFolderUrl,
        configData.share.sharedFolderUser,
        configData.share.sharedFolderPassword,
        sharedLocalFolder);
}


// Connect To WinCC Openpipe
ConnectRuntime.Connect((runtimeClass) => {

    // create pipe runtime obj from lib
    const ccRuntime = runtimeClass.Runtime;

    // create the data stream pipe
    const histPipe = fs.openSync(HISTORY_PATH, 'r+');
    initializeHistoryPipe(histPipe);


    //This function starts if one of the tags from the subscribe list changes 
    ccRuntime.on('NotifySubscribeTag', (tagsList, cookie) => {

        // for each tag in received list
        for (let tagobject of tagsList) {

            if (tagobject.Name == triggerTagConfig) {
                // the first trigger for requesting Report
                //console.log("new_trigger_", tagobject.Value);
                if (tagobject.Value == "TRUE" || tagobject.Value == true) {
                    // send the query with requested data
                    requestTags(ccRuntime);
                }
            }
            else if (tagobject.Name == startTimeTag) {
                // change the report start time
                startTimeQuery = new Date(tagobject.Value).getTime();
                if (!startTimeQuery) {
                    // if time is null or empty restore default -1h
                    startTimeQuery = endTimeQuery - (1000 * 60 * 60);
                }
                console.log("[CONF] - new StartTime:", tagobject.Value, startTimeQuery);
            }
            else if (tagobject.Name == endTimeTag) {
                // change the report end time
                endTimeQuery = new Date(tagobject.Value).getTime();
                if (!endTimeQuery) {
                    // if time is null or empty restore default -1h
                    endTimeQuery = new Date().getTime();
                }
                console.log("[CONF] - new EndTime:", tagobject.Value, endTimeQuery);
            }
            else if (tagobject.Name == templateFilenameTag) {
                // change the report template filename
                if (tagobject.Value.match(templateRegex)) {
                    reportTemplateFile = configPath + tagobject.Value;
                    templateIsConfigured = true;
                    console.log("[CONF] - new Template file:", reportTemplateFile);
                }
                else { console.log("[ERR_] - Template file has an incompatible format:", reportTemplateFile); }
            }
            else if (tagobject.Name == triggerDeleteReports) {
                // delete all reports in all folders
                if (tagobject.Value == "TRUE" || tagobject.Value == true) {
                    deleteAllReports().then(() => {
                        // write generate report xlsx filename to unified
                        ccRuntime.WriteTag([{
                            "Name": triggerDeleteReports,
                            "Value": "0"
                        }], "WriteTagCookie");

                    });
                }
            }
            else if (tagobject.Name == 'rpc_response' && tagobject.Value == "1" && templateIsConfigured) {
                console.log("[INFO] - All data collected from WinCC.");
                // if stream active create report
                if (stream) {
                    createReport().then((() => {
                    
                        // write generate report xlsx filename to unified
                        ccRuntime.WriteTag([{
                            "Name": reportFilenameTag,
                            "Value": reportStoragePath
                        }], "WriteTagCookie");

                        //and write request status to 2 for PDF converting
                        ccRuntime.WriteTag([{
                            "Name": "rpc_request_status",
                            "Value": "2"
                        }], "WriteTagCookie");

                    }));
                }
            }
            else if (tagobject.Name == 'rpc_response' && tagobject.Value == "2" && templateIsConfigured) {
                // the PDF is ready to be copied
                console.log("[INFO] - Copy converted PDF and base reports", tagobject.Value);
                copyPDFReport().then((() => {
                    // finished
                    console.log("[INFO] - Reporting ended successfully!");
                }));
            }
        }
    });


    // Subscribe Config Tags
    ccRuntime.SubscribeTag(['rpc_response',
        triggerTagConfig,
        startTimeTag,
        endTimeTag,
        templateFilenameTag,
        triggerDeleteReports], "ReportEdgeTagCookie1");
    // ccRuntime.SubscribeTag(['rpc_response'], "ReportEdgeTagCookie1");
    // ccRuntime.SubscribeTag([triggerTagConfig], "ReportEdgeTagCookie2");
    // ccRuntime.SubscribeTag([startTimeTag], "ReportEdgeTagCookie3");
    // ccRuntime.SubscribeTag([endTimeTag], "ReportEdgeTagCookie4");
    // ccRuntime.SubscribeTag([templateFilenameTag], "ReportEdgeTagCookie5");
});


// create report data stream pipe and intialize on data event callback
function initializeHistoryPipe(fd) {

    if (stream === null) {
        // create a stream for HmiHistory                       //1KB  //1MB  //128MB
        stream = fs.createReadStream(null, { fd, highWaterMark: 1024 * 1024 * 128 })
        stream.setEncoding("utf-8");
        console.log("[INFO] - Report stream created");
    }

    // callback on stream data receiving
    stream.on('data', (jsonStr) => {

        //console.log("stream.on", jsonStr);

        // search if new chunk is already buffered
        let chunkIndex = receivedBuffer.findIndex(x => x.indexOf(jsonStr) !== -1);
        if (chunkIndex == -1) {
            // if new string is not already included in received string buffer, then get it
            receivedBuffer.push(jsonStr);
        }

        // search if end of file is already bufferred
        let endIndex = receivedBuffer.findIndex(x => x.indexOf(ETX) !== -1);
        if (endIndex != -1) {
            // after that we read the all file piece by piece, merge them
            let receivedString = receivedBuffer.join("");
            // clear the buffer
            receivedBuffer = [];
            //console.log("[DEBUG] - End of data found", jsonStr);
            let formattedString = receivedString.replace(ETX, "").replace(/\n/g, " ");
            console.log("[INFO] - New data parsed (begin):", formattedString.substr(0, 150));
            console.log("[INFO] - New data parsed (end):", formattedString.substr(-150, 150));

            // convert to JSON
            let jsonObj = JSON.parse(formattedString);
            //console.log("[DEBUG] - Data successfully parsed", jsonObj);

            // push data to global report variable
            reportdatajson.tagsList = jsonObj.Tags;
            reportdatajson.trendList = jsonObj.Logging;
            if (alarmsEnabled) {
                reportdatajson.alarmsList = jsonObj.Alarms;
            }
            reportdatajson.startTime = jsonObj.StartTime;
            reportdatajson.endTime = jsonObj.EndTime;
            reportdatajson.startTimeData = jsonObj.StartTimeData;
            reportdatajson.endTimeData = jsonObj.EndTimeData;

            console.log("[INFO] - Data ready for report (begin):", JSON.stringify(reportdatajson).substr(0, 150));
            console.log("[INFO] - Data ready for report (end):", JSON.stringify(reportdatajson).substr(-150, 150));
        }

    });

}


// Start to stream data from the named pipe HmiHistory to read the logging tag values
function requestTags(ccRuntime) {

    // update report time range query values
    query.Params.To = endTimeQuery;
    query.Params.From = startTimeQuery;

    // prepare the template report data object
    reportdatajson = { "tagsList": {}, "trendList": [], "alarmsList": [] };

    // write query by dividing in 254-char chunks array
    let chunkQuery = queryChunkSubstr(JSON.stringify(query), 254);
    let tagWriteObj = [];

    for (let j = 0; j < chunkQuery.length; j++) {
        tagWriteObj.push({
            "Name": "rpc_request[" + j + "]",
            "Value": chunkQuery[j]
        });
    }

    // add status 1 to trigger WinCC data read
    tagWriteObj.push({
        "Name": "rpc_request_status",
        "Value": "1"
    });
    // write query and status code
    ccRuntime.WriteTag(tagWriteObj, "WriteTagCookie");
    console.log("[INFO] - Query request was sent to WinCC", tagWriteObj);
}


// divide a string in array based on chunks size
function queryChunkSubstr(str, size) {
    // calc num of chunks to be created
    let numChunks = Math.ceil(str.length / size);
    // limit chunks to wincc array length (100)
    numChunks = numChunks < 100 ? numChunks : 99;
    // create chunks array
    let chunks = new Array(numChunks);

    for (let i = 0, pStart = 0; i < numChunks; i++, pStart += size) {
        // slide on string and extract chunk step by step
        chunks[i] = str.substr(pStart, size);
    }
    return chunks
}


// Create the Report in xlsx or ods format.
// for Logging, Input is a JSON in the Format {ts:Timestamp, HMI_Tag_Name1:Value,HMI_Tag_Name2:Value,}
function createReport() {
    console.log("[INFO] - Start creating Report with Template file", reportTemplateFile);
    //console.log("[DEBUG] - Report data:", JSON.stringify(reportdatajson));

    return new Promise(function (resolve, reject) {
        // render template with report data
        carbone.render(reportTemplateFile, reportdatajson, function (err, result) {
            if (err) {
                console.log("[ERR_] - Error in Report rendering:", err);
                reject(err);
            }
            else {
                // if report is ready, write to USB or SD Card Archive
                let printTime = new Date().toISOString().replace("T", "_").substring(0, 11) + new Date().toTimeString().replace(/:/g, "-").substring(0, 8);
                let templatename = reportTemplateFile.replace(configPath, "");
                //let templatename = reportTemplateFile.replace(configPath, "").replace(/(.xlsx|.xls|.XLS|.XLSX)$/g, "");
                let reportName = 'Unified_Report_' + printTime + '_' + templatename;
                reportStoragePath = storagePortConfig + '/' + reportName;
                // write to publish folder
                fs.writeFileSync('/publish/' + reportName, result);
                console.log("[INFO] - Report written to PUBLISH.");
                // write to ARCHIVE SD or USB folder
                fs.writeFileSync('/media/simatic/' + reportStoragePath, result);
                console.log("[INFO] - Report written to STORAGE", storagePortConfig);
                // write to shared folder if enabled
                if (sharedEnabled) {
                    fs.writeFileSync(sharedLocalFolder + '/' + reportName, result);
                    console.log("[INFO] - Report written to SHARED", configData.share.sharedFolderUrl);
                }
                // return
                resolve();
            }
        });
    });
}


// when base report is ready and converted to pdf, copy it to other folders
function copyPDFReport() {

    return new Promise((resolve, reject) => {
        // create paths for USB files
        let reportFileStoragePath = '/media/simatic/' + reportStoragePath;
        let reportPdfStoragePath = reportFileStoragePath.replace(templateRegex, ".pdf");

        // extract reportname
        let reportName = reportStoragePath.replace(storagePortConfig + '/', "");
        let reportNamePDF = reportName.replace(templateRegex, ".pdf");

        try {
            // To Publish
            fs.copyFileSync(reportPdfStoragePath, '/publish/' + reportNamePDF);
            console.log("[INFO] - Report", reportPdfStoragePath, "copied to /publish/", reportNamePDF);

            if (sharedEnabled) {
                // To shared folder
                fs.copyFileSync(reportPdfStoragePath, sharedLocalFolder + '/' + reportNamePDF);
                console.log("[INFO] - Report", reportPdfStoragePath, "copied to Shared folder.");
            }
            resolve();
        }
        catch (err) {
            console.log("[ERR_] - PDF Copy got error:", err);
            reject(err);
        }
    });
}

// delete all files that match report regex format in all possible folders
function deleteAllReports() {

    const paths = ['/publish/', sharedLocalFolder + '/', '/media/simatic/' + storagePortConfig + '/'];
    return new Promise((resolve, reject) => {
        // for each path
        for (let i = 0; i < paths.length; i++) {
            // get files, filter by regex
            let filesToBeDeleted = fs.readdirSync(paths[i]).filter(f => reportRegex.test(f) && f.startsWith("Unified_Report_"));
            //  and delete them
            filesToBeDeleted.map(f => fs.unlinkSync(paths[i] + f));
            console.log("[INFO] - Deleted", filesToBeDeleted.length, "files in folder", paths[i]);
        }
        resolve();
    });
}