'use strict';

const opn = require(__dirname + '/opn.js');

function fix_tags_order(tagsArr, tagsObjectArr) {
    let resptags = [];
    resptags.length = tagsArr.length;
    for (let i in tagsObjectArr) {
        let tagindex = tagsArr.indexOf(tagsObjectArr[i].Name);
        if (-1 != tagindex) {
            resptags[tagindex] = tagsObjectArr[i];
        }
        else {
            console.error('Response tag not found: ' + tagsObjectArr[i].Name);
        }
    }
    return resptags;
}


class EasyRuntime {    
    constructor(runtime_class_object, options) {
        this.cookieCounter = 1;
        this.rt_class_obj = runtime_class_object;
        if (options) {
            this.rt_options = options;
        }
        else {
            this.rt_options = {
                language: undefined,
                systems: [''],
                onDisconnect: undefined
            };
        }

        this.get_rt = function () {
            if (this.rt_class_obj) {
                return this.rt_class_obj.Runtime;
            }
            else {
                throw 'runtime not connected';
            }
        };        
    }

    readTags(tagsArr) {
        const newCookie = this.cookieCounter++;
        let cookieCb = [];
        let self = this;
        let promise = new Promise(function (resolve, reject) {
            cookieCb[newCookie] = {
                fulfill: resolve,
                error: reject,
                tags: tagsArr
            };
            self.get_rt().on('NotifyReadTag', (tagsobject, cookie) => { //register callback
                let req = cookieCb[cookie];
                if (req) {
                    let resptags = fix_tags_order(req.tags, tagsobject);

                    req.fulfill(resptags);
                }
            });

            self.get_rt().ReadTag(tagsArr, newCookie); //read tag
        });

        return promise;
    }
    
    subscribeTags(tagsArr, cb_func) {
        const newCookie = this.cookieCounter++;
        let cookieCb = [];
        let self = this;

        cookieCb[newCookie] = {
            cb: cb_func,
            tags: tagsArr
        };

        self.get_rt().on('NotifySubscribeTag', (tagsobject, cookie) => { //register callback
            let req = cookieCb[cookie];
            if (req) {
                let resptags = fix_tags_order(req.tags, tagsobject);
                req.cb(resptags);
            }
        });

        self.get_rt().on('NotifyUnsubscribeTag', (cookie) => { //register callback
            let req = cookieCb[cookie];
            if (req) {
                console.log('Unsuscribed');
            }
        });

        self.get_rt().SubscribeTag(tagsArr, newCookie); //read tag

        return {
            close: () => {
                self.get_rt().UnsubscribeTag(newCookie);
            }
        };
    }
    
    writeTagValues(tagsValuesArr) {
        const newCookie = this.cookieCounter++;
        let cookieCb = [];
        let self = this;

        let promise = new Promise(function (resolve, reject) {
            cookieCb[newCookie] = {
                fulfill: resolve,
                error: reject,
                tags: tagsValuesArr
            };
            self.get_rt().on('NotifyWriteTag', (tagsobject, cookie) => { //register callback
                let req = cookieCb[cookie];
                if (req) {
                    req.fulfill();
                }
            });

            let tagWriteObjs = [];
            tagWriteObjs.length = tagsValuesArr.length;

            for (let iTag in tagsValuesArr) {
                tagWriteObjs[iTag] = {
                    Name: tagsValuesArr[iTag][0],
                    Value: tagsValuesArr[iTag][1]
                };
            }

            self.get_rt().WriteTag(tagWriteObjs, newCookie); //read tag
        });

        return promise;
    }

    readAlarms(filter_string, options) {
        const newCookie = this.cookieCounter++;
        let cookieCb = [];
        let self = this;

        let promise = new Promise(function (resolve, reject) {
            cookieCb[newCookie] = {
                fulfill: resolve,
                error: reject,
                filter: filter_string
            };
            self.get_rt().on('NotifyReadAlarm', (alarmsobject, cookie) => { //register callback
                let req = cookieCb[cookie];
                if (req) {
                    let respalarms = alarmsobject;
                    req.fulfill(respalarms);
                }
            });

            if (!options) {
                options = self.rt_options;
            }

            self.get_rt().ReadAlarm(self.rt_options.systems, filter_string, self.rt_options.language, newCookie); //read tag
        });

        return promise;
    }

    subscribeAlarms (filter_string, options_or_cb_func, cb_func) {
        let cookieCb = [];
        const newCookie = this.cookieCounter++;
        let self = this;

        let options = this.rt_options;

        if (typeof options_or_cb_func === 'function') {
            cb_func = options_or_cb_func;
        }
        else {
            options = options_or_cb_func;
        }

        cookieCb[newCookie] = {
            cb: cb_func,
            filter: filter_string
        };

        self.get_rt().on('NotifySubscribeAlarm', (alarmsobject, cookie) => { //register callback
            let req = cookieCb[cookie];
            if (req) {
                let respalarms = alarmsobject;
                req.cb(respalarms);
            }
        });

        self.get_rt().on('NotifyUnsubscribeAlarm', (cookie) => { //register callback
            let req = cookieCb[cookie];
            if (req) {
                console.log('Unsuscribed');
            }
        });


        self.get_rt().SubscribeAlarm(self.rt_options.systems, filter_string, self.rt_options.language, newCookie); //subscribe alarm

        return {
            close: () => {
                self.get_rt().UnsubscribeAlarm(newCookie);
            }
        };
    }
        
    close() {
        opn.Disconnect(this.rt_class_obj);
    }
}

exports.open = function (options) {
    const connect_timeout = 10000; //10s
    return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            opn.Disconnect();
            reject();
        }, connect_timeout);

        opn.Connect((param_rt) => {
            clearTimeout(timeoutId);            
            resolve(new EasyRuntime(param_rt, options));
        }, options ? options.onDisconnect : undefined);
    });
};