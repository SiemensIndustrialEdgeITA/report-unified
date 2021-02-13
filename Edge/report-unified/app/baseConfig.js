// basic config schema
const configTemplate = {
    "usbPortConfig": "X61",
    "triggerTagConfig": "TriggerTag1",
    "startTimeTag": "ReportStartTimeTag",
    "endTimeTag": "ReportEndTimeTag",
    "templateFilenameTag": "TemplateFilenameTag",
    "loggingTags": [
    ],
    "tags": [
    ],
    "alarms": false,
    "share": {
        "enabled": false,
        "sharedFolderUrl": "",
        "sharedFolderUser": "",
        "sharedFolderPassword": ""
    }
};

// export config schema
module.exports.configTemplate = configTemplate;