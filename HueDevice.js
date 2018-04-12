const DeviceBase = require('./DeviceBase.js');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');

const XML_DESCRIPTION = fs.readFileSync('devices/hue/description.xml', 'utf8');
const TXT_DISCOVER = fs.readFileSync('devices/hue/discover.txt', 'utf8');

class HueDevice extends DeviceBase{

	constructor(name, port){
		super(port);

		this.name = name;
		this.serial = crypto.createHash('md5').update(this.name).digest('hex');
	}

	_handleRequest(request, response){

		response.setHeader('Content-Type', 'text/xml; charset=utf-8');
		// response.setHeader('Date', 'Sun, 01 Jan 2017 00:00:00 GMT');
		// response.setHeader('Last-Modified', 'Sat, 01 Jan 2000 00:01:15 GMT');
		// response.setHeader('Server', 'Unspecified, UPnP/1.0, Unspecified');  
		// response.setHeader('X-User-Agent', 'redsonic');
		response.setHeader('Connection', 'close');

		switch(request.url){
			case '/description.xml':
				console.log('setup...');
				const payload = util.format(XML_DESCRIPTION, this.address, this.port);
				response.write(payload, response.end.bind(response));
			break;
		}
	}

	discover(){
		return util.format(TXT_DISCOVER, this.address, this.port);
	}
}

module.exports = HueDevice;