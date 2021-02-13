export function TagsRealtimeRead(rtags) {
    // read realtime tags promise
    //
    let realtimeTagsResponse = {};

    return new Promise((resolve, reject) => {
        // create object with last real time data
        for (let i = 0; i < rtags.length; i++) {
            //HMIRuntime.Trace("rtags___" + rtags[i]);
            realtimeTagsResponse[rtags[i]] = Tags(rtags[i]).Read();
        }
        resolve(realtimeTagsResponse);
    });
}