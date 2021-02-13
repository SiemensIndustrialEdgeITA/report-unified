// file generated from openness_protocol.json
'use strict';

class RuntimeClass {
  constructor(client) {
    this.m_client = client;
    this.m_subs = {
      'NotifySubscribeTag':[],
      'NotifyUnsubscribeTag':[],
      'NotifyReadTag':[],
      'NotifyWriteTag':[],
      'ErrorWriteTag':[],
      'NotifySubscribeAlarm':[],
      'NotifyUnsubscribeAlarm':[],
      'NotifyReadAlarm':[],
      'ErrorSubscribeAlarm':[],
      'ErrorReadAlarm':[]
    };
  }

  SubscribeTag(TagsParam, ClientCookieParam){
    let o = {
      Message: 'SubscribeTag', 
      Params: {
        Tags: TagsParam
      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  ReadTag(TagsParam, ClientCookieParam){
    let o = {
      Message: 'ReadTag', 
      Params: {
        Tags: TagsParam
      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  WriteTag(TagsParam, ClientCookieParam){
    let o = {
      Message: 'WriteTag', 
      Params: {
        Tags: TagsParam
      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
    console.log("Write Tag: " + JSON.stringify(o))
  }

  UnsubscribeTag(ClientCookieParam){
    let o = {
      Message: 'UnsubscribeTag', 
      Params: {

      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  SubscribeAlarm(SystemNamesParam, FilterParam, LanguageIdParam, ClientCookieParam){
    let o = {
      Message: 'SubscribeAlarm', 
      Params: {
        SystemNames: SystemNamesParam,
        Filter: FilterParam,
        LanguageId: LanguageIdParam
      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  UnsubscribeAlarm(ClientCookieParam){
    let o = {
      Message: 'UnsubscribeAlarm', 
      Params: {

      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  ReadAlarm(SystemNamesParam, FilterParam, LanguageIdParam, ClientCookieParam){
    let o = {
      Message: 'ReadAlarm', 
      Params: {
        SystemNames: SystemNamesParam,
        Filter: FilterParam,
        LanguageId: LanguageIdParam
      },
      ClientCookie: ClientCookieParam
    };

    this.m_client.write(JSON.stringify(o) + '\n');
  }

  on(notifyName, cb) {
    if (!this.m_subs[notifyName]) {
        console.error('Handler for message \'' + notifyName + '\' not supported');
    }
    else {
        this.m_subs[notifyName].push(cb);
    }
  }

  process(ev) {
    let subs = this.m_subs[ev.Message];
    if (!subs) {
      console.error('Handler for message \'' + ev.Message + '\' not found');
    }
    else {
      for (let cb of subs) {
        if(ev.Message == 'NotifySubscribeTag'){
          cb(ev.Params.Tags, ev.ClientCookie);
        }
        if(ev.Message == 'NotifyUnsubscribeTag'){
          cb(ev.ClientCookie);
        }
        if(ev.Message == 'NotifyReadTag'){
          cb(ev.Params.Tags, ev.ClientCookie);
        }
        if(ev.Message == 'NotifyWriteTag'){
          cb(ev.Params.Tags, ev.ClientCookie);
        }
        if(ev.Message == 'ErrorWriteTag'){
          cb(ev.Params.Tags, ev.ClientCookie);
        }
        if(ev.Message == 'NotifySubscribeAlarm'){
          cb(ev.Params.Alarms, ev.ClientCookie);
        }
        if(ev.Message == 'NotifyUnsubscribeAlarm'){
          cb(ev.ClientCookie);
        }
        if(ev.Message == 'NotifyReadAlarm'){
          cb(ev.Params.Alarms, ev.ClientCookie);
        }
        if(ev.Message == 'ErrorSubscribeAlarm'){
          cb(ev.Params.Alarms, ev.ClientCookie);
        }
        if(ev.Message == 'ErrorReadAlarm'){
          cb(ev.Params.Alarms, ev.ClientCookie);
        }
      }
    }
  }
}

exports.TheRuntimeClass = RuntimeClass;

