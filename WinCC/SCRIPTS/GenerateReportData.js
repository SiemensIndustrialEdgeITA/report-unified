export function GenerateReportData(loggingTags, realtimeTags, tStart, tEnd, bv, alarmsEnabled, id) {

    // generate data for report based on request

    const STX = String.fromCharCode(2);
    const ETX = String.fromCharCode(3);

    let startTime = new Date();
    // prepare response
    let response = {
        "Id": id,
        "Error": { Code: 0, Text: "" },
        "Tags": {},
        "Logging": {},
        "Alarms": [],
        "StartTime": startTime.toLocaleString()
    }

    HMIRuntime.Trace("Starting generate data...");

    return new Promise((resolve, reject) => {
        // read data from promises
        TagsLoggingRead(loggingTags, tStart, tEnd).then((loggingResponse) => {
            response.Logging = loggingResponse;
            TagsRealtimeRead(realtimeTags).then((tagsResponse) => {
                response.Tags = tagsResponse;
                AlarmsLoggingRead(alarmsEnabled, tStart, tEnd).then((alarmsResponse) => {
                    response.Alarms = alarmsResponse;
                    // close the response
                    let endTime = new Date();
                    response.EndTime = endTime.toLocaleString();
                    response.Duration = (endTime - startTime);
                    response.StartTimeData = tStart.toLocaleString();
                    response.EndTimeData = tEnd.toLocaleString();
                    // encode in a string
                    let data = JSON.stringify(response) + ETX;
                    HMIRuntime.Trace("DATATOWRITE: " + data.substring(0, 300));
                    resolve(data);
                });
            });
        });
    });

}