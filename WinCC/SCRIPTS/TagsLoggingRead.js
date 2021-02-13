export function TagsLoggingRead(ltags, start, end) {
    // promise for read logging tags
    
    let loggingTagsResponse = {};

    return new Promise((resolve, reject) => {
        // single group read
        const loggingGroupRead = (ltagsGroup) => {
            HMIRuntime.Trace(`Start reading logging tags for group: ${ltagsGroup.id} .`);
            // 
            var ltagsGroupResponse = [];

            return new Promise((resolve) => {
                // read logged data
                let logTagSet = HMIRuntime.TagLogging.CreateLoggedTagSet(ltagsGroup.tags);

                logTagSet.Read(start, end, false).then((loggedTagMap) => {
                    // 
                    for (let loggedTag of loggedTagMap) {
                        // HMIRuntime.Trace("TagName " + loggedTag.Name);
                        let tagName = loggedTag.Name.split(":")[0];
                        // HMIRuntime.Trace("tagnane__" + tagName);
                        for (let loggedTagValue of loggedTag.Values) {
                            // HMIRuntime.Trace("loggedtags__" + loggedTagValue.Value);
                            let tsms = parseInt(loggedTagValue.TimeStamp);
                            // round to seconds by converting to localestring, then back to date format
                            let ts = new Date(new Date(tsms).toLocaleString());
                            // HMIRuntime.Trace("ts__" + ts);
                            let itemIndex = ltagsGroupResponse.findIndex(x => x.ts == ts.getTime());

                            if (itemIndex == -1) {
                                // if not exist, create time element and push to group response
                                let item = { ts: ts.getTime() };
                                item[tagName] = loggedTagValue.Value;
                                // HMIRuntime.Trace("newitem__" + JSON.stringify(item));
                                ltagsGroupResponse.push(item);
                            }
                            else {
                                // else add the new tag to the existent item
                                ltagsGroupResponse[itemIndex][tagName] = loggedTagValue.Value;
                                // HMIRuntime.Trace("ts__" +  JSON.stringify(ltagsGroupResponse[itemIndex]));
                            }
                        }
                    }
                }).then(() => {
                    // sort and transform date
                    ltagsGroupResponse.sort(function (a, b) { return a.ts - b.ts });
                    ltagsGroupResponse.map(function (item, index) {
                        item.ts = new Date(item.ts).toLocaleString();
                        return item
                    });
                }).then(() => {
                    resolve(ltagsGroupResponse);
                });

            });

        }

        // promise loop
        const doNextRead = (gIndex) => {
            loggingGroupRead(ltags[gIndex])
                .then((ltagsGroupRes) => {
                    let id = ltags[gIndex]["id"];
                    HMIRuntime.Trace(`Finished tag group ${id} read.\n`);
                    // create logging group obj
                    loggingTagsResponse[id] = ltagsGroupRes;
                    // try next group
                    gIndex++;
                    if (gIndex < ltags.length) {
                        doNextRead(gIndex)
                    } else {
                        HMIRuntime.Trace(`Finished logging groups read.`);
                        resolve(loggingTagsResponse);
                    }
                })
        }

        // START read
        doNextRead(0);
    });

}