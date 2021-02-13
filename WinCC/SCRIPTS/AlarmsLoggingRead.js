export function AlarmsLoggingRead(alarmsEnabled, start, end) {
    // read logging alarm promise

    // create response
    let alarmsResponse = [];
    HMIRuntime.Trace("alarms enabled__" + alarmsEnabled + "___" + (alarmsEnabled ? true : false));
    HMIRuntime.Trace("start__" + start + "__end__" + end);
    if (alarmsEnabled) {
        return new Promise((resolve, reject) => {
            // read logged alarms
            HMIRuntime.AlarmLogging.Read(start, end, "", 1033).then((loggedAlarmResultArray) => {
                // HMIRuntime.Trace("loggedAlarmResultArray_" + loggedAlarmResultArray[0].RaiseTime);
                // extract info from log alarms and create data response
                for (var loggedAlarmResult of loggedAlarmResultArray) {
                    let tsms = parseInt(loggedAlarmResult.RaiseTime);
                    let ts = new Date(tsms).toLocaleString();
                    let item = { "ts": ts, "alarmText": loggedAlarmResult.EventText, "alarmStatus": loggedAlarmResult.StateText };
                    // HMIRuntime.Trace("Time " + ts + " State " + loggedAlarmResult.State + " Eventtext " + loggedAlarmResult.EventText + " Statetext " + loggedAlarmResult.StateText);
                    alarmsResponse.push(item);
                }
                HMIRuntime.Trace("Logged Alarms length:" + alarmsResponse.length);
                //HMIRuntime.Trace("ALARMS____" + alarmsResponse.join("---"));
            }).then(() => {
                // when finsihed return alarms list
                resolve(alarmsResponse);
            });
        });
    } else { return [] }

}