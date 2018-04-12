'use strict';

const DeviceBase = require('./DeviceBase.js');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const os = require('os');

const XML_SETUP = fs.readFileSync('devices/wemo/setup.xml', 'utf8');
const XML_EVENTSERVICE = fs.readFileSync('devices/wemo/eventservice.xml', 'utf8');
const XML_METAINFOSERVICE = fs.readFileSync('devices/wemo/metainfoservice.xml', 'utf8');

const XML_GETSTATE = fs.readFileSync('devices/wemo/getstate.xml', 'utf8');
const XML_SETSTATE = fs.readFileSync('devices/wemo/setstate.xml', 'utf8');

class WemoDevice extends DeviceBase{

	constructor(name, port, state = 0){
		
		super(port, 'urn:Belkin:device:**');

		this.name = name;
		this.serial = crypto.createHash('md5').update('wemo' + this.name).digest('hex');

		this.state = state; // switch state (0, 1)
	}

	_handleRequest(request, response){

		response.setHeader('Date', new Date().toGMTString());
		response.setHeader('Server', `${os.type()}/${os.release()} UPnP/1.0 Node/1.0`);
		response.setHeader('Content-Type', 'text/xml; charset=utf-8');
		response.setHeader('Connection', 'close');

		switch(request.url){
			
			// service endpoints
			case '/setup.xml':
				const payload = util.format(XML_SETUP, this.name, this.uuid, this.serial);
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

							const lastState = this.state;

							if(body.indexOf('<BinaryState>1</BinaryState>') >= 0){
								this.state = 1;
								this.emit('on');
							}
							else if(body.indexOf('<BinaryState>0</BinaryState>') >= 0){
								this.state = 0;
								this.emit('off');
							}

							if(this.state !== lastState){
								this.emit('change', this.state);
							}

							response.write(util.format(XML_SETSTATE, this.state), response.end.bind(response));
						});
					}
					else{
						response.write(util.format(XML_GETSTATE, this.state), response.end.bind(response));
					}
				}
				else{
					response.write(util.format('<serialNumber>%s</serialNumber>', this.serial), response.end.bind(response));
				}
			break;

			default:
				response.write(util.format('<serialNumber>%s</serialNumber>', this.serial), response.end.bind(response));
		}
	}
}

module.exports = WemoDevice;