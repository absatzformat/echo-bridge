'use strict';

const EventEmitter = require('events').EventEmitter;
const os = require('os');
const http = require('http');

const uuidv4 = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

const localIP = () => {
	// const interfaces = os.networkInterfaces();
	// TODO: get local ip
	return os.hostname().toLowerCase();
};

class DeviceBase extends EventEmitter{

	constructor(port, target = 'upnp:rootdevice'){

		super();

		this.port = port;
		this.target = target;

		this.address = localIP();
		this.uuid = uuidv4();

		this.socket = http.createServer(this._handleRequest.bind(this));
		this.socket.listen(this.port);
	}

	get location(){
		return `http://${this.address}:${this.port}/setup.xml`;
	}

	_handleRequest(request, response){
		response.end();
	}
}

module.exports = DeviceBase;