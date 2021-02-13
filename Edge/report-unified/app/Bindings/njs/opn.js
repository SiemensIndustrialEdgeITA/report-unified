'use strict';

const net = require('net');
const readline = require('readline');
const os = require('os');
const rt_objects = require(__dirname + '/opn_runtime_api.js');

class RuntimeClass {
    constructor(client) {
        
        this.m_client = client;
        this.m_objects = {
            'Runtime': new rt_objects.TheRuntimeClass(this.m_client)
        };
        const rl = readline.createInterface(
            {
                input: client,
                crlfDelay: Infinity
            });
        rl.on('line', (line) => {
            let obj = JSON.parse(line);
            this.m_objects['Runtime'].process(obj);
        }
        );
    }

    close() {
        this.m_client.end();
    }
    
    get Runtime() {
        return this.m_objects['Runtime'];
    }
}


function get_pipe_name() {
    if (os.platform() === 'win32') {
        return '\\\\.\\pipe\\HmiRuntime';
    }
    else {
        return '/tmp/siemens/automation/HmiRuntime';
    }
}


function ConnectRT(connected_func, disconnect_func) {
    let client = net.createConnection(get_pipe_name(), () => {
        connected_func(new RuntimeClass(client));
    });
//Wait 10s to reconnect with no pipe connection is possible
    client.on('error', (err) => {
        console.error('pipe connection error=\'' + err.message + '\'');
        setTimeout(() => ConnectRT(connected_func,disconnect_func), 10000) ;       
    });

    client.on('close', () => {
        if (disconnect_func) {
            disconnect_func();            
        }
    });
}

function DisconnectRT(runtime_class_object) {
    if (runtime_class_object) {
        runtime_class_object.close();
    }
    else {
        console.error('pipe not connected!');
    }
}

exports.Connect = ConnectRT;
exports.Disconnect = DisconnectRT;

