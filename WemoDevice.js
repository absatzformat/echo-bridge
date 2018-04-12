const DeviceBase = require('./DeviceBase.js');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');

const XML_SETUP = fs.readFileSync('devices/wemo/setup.xml', 'utf8');
const XML_EVENTSERVICE = fs.readFileSync('devices/wemo/eventservice.xml', 'utf8');
const XML_METAINFOSERVICE = fs.readFileSync('devices/wemo/metainfoservice.xml', 'utf8');

const XML_GETSTATE = fs.readFileSync('devices/wemo/getstate.xml', 'utf8');
const XML_SETSTATE = fs.readFileSync('devices/wemo/setstate.xml', 'utf8');

class WemoDevice extends DeviceBase{

	constructor(name, port, state = false){
		super(port, 'urn:Belkin:device:**');

		this.name = name;
		this.serial = crypto.createHash('md5').update(this.name).digest('hex');

		this.state = state; // switch state
	}

	_handleRequest(request, response){

		response.setHeader('Content-Type', 'text/xml; charset=utf-8');
		response.setHeader('Date', new Date().toGMTString());
		response.setHeader('Server', 'Unspecified, UPnP/1.0, Unspecified');  
		response.setHeader('X-User-Agent', 'redsonic');
		response.setHeader('Connection', 'close');

		switch(request.url){
			
			// service endpoints
			case '/setup.xml':
				const payload = util.format(XML_SETUP, this.name, this.uuid, this.serial, this.state);
				response.write(payload, response.end.bind(response));
			break;
			case '/eventservice.xml':
				response.write(XML_EVENTSERVICE, response.end.bind(response));
			break;
			case '/metainfoservice.xml':
				response.write(XML_METAINFOSERVICE, response.end.bind(response));
			break;

			// control endpoint
			case '/upnp/control/basicevent1':
				if(typeof request.headers.soapaction !== 'undefined'){
					const action = request.headers.soapaction

					if(action.indexOf('SetBinaryState') >= 0){

						let body = '';

						request.on('data', (data) => body += data.toString());
						request.on('end', () => {

							if(body.indexOf('<BinaryState>1</BinaryState>') >= 0){
								this.state = true;
								this.emit('change', this.state);
							}
							else if(body.indexOf('<BinaryState>0</BinaryState>') >= 0){
								this.state = false;
								this.emit('change', this.state);
							}

							response.write(util.format(XML_SETSTATE, this.state), response.end.bind(response));
						});

						return;
					}

					response.write(util.format(XML_GETSTATE, this.state), response.end.bind(response));
				}
				response.statusCode = 400;
				response.end();
			break;

			default:
				response.statusCode = 400;
				response.end();
		}
	}

	discover(){
		return [
			'HTTP/1.1 200 OK',
			'CACHE-CONTROL: max-age=86400',
			`DATE: ${new Date().toGMTString()}`,
			'EXT:',
			`LOCATION: http://${this.address}:${this.port}/setup.xml`,
			'OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01',
			`01-NLS: ${this.uuid}`,
			'SERVER: Unspecified, UPnP/1.0, Unspecified',
			`ST: ${this.target}`,
			`USN: uuid:${this.serial}::${this.target}`,
			'X-User-Agent: redsonic',
			'',
			''
		].join('\r\n');
	}
}

module.exports = WemoDevice;