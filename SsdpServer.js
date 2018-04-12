const os = require('os');
const dgram = require('dgram');

class SsdpServer{

	constructor(devices){

		this.devices = devices;
		this.notifyInterval = 0;

		this.socket = dgram.createSocket({
			type: 'udp4',
			reuseAddr: true
		});

		this.socket.on('listening', this.onListening.bind(this));
		this.socket.on('message', this.onMessage.bind(this));
		this.socket.on('close', this.onClose.bind(this));
	}

	start(){

		this.socket.bind(1900);
	}

	stop(){
		
		this.socket.close();
	}

	onListening(){
		const address = this.socket.address();
		console.log(`Server listening on ${address.address}:${address.port}`);

		this.socket.addMembership('239.255.255.250');
		this.notifyAll();
		this.notifyInterval = setInterval(this.notifyAll.bind(this), 36000);
	}

	onClose(){
		clearInterval(this.notifyInterval);
	}

	parseMessage(message){
		const rows = message.trim().split('\r\n');
		const data = {type: rows.shift()};
		rows.forEach((row) => {
			const col = row.indexOf(':');
			if(col >= 0){
				const key = row.substring(0, col).trim().toLowerCase();
				const value = row.substring(col + 1).trim();
				data[key] = value;
			}
		});
		return data;
	}

	notifyAll(){
		this.devices.forEach((device) => {

			const payload = this.notifyMessage(device.target, device.location, device.serial);
			const buffer = Buffer.from(payload);

			setTimeout(() => {
				this.socket.send(payload, 0, payload.length, 1900, '239.255.255.250');
			}, Math.random() * 1000);
		});
	}

	notifyMessage(target, location, serial){
		return [
			'NOTIFY * HTTP/1.1',
			'HOST: 239.255.255.250:1900',
			'CACHE-CONTROL: max-age=3600',
			`LOCATION: ${location}`,
			'NTS: ssdp:alive',
			`NT: ${target}`,
			`SERVER: ${os.type()}/${os.release()} UPnP/1.0 Node/1.0`,
			`USN: uuid:${serial}::${target}`,
			'',
			''
		].join('\r\n');
	}

	searchResponse(target, location, uuid, serial){
		return [
			'HTTP/1.1 200 OK',
			'CACHE-CONTROL: max-age=3600',
			`DATE: ${new Date().toGMTString()}`,
			'EXT:',
			`LOCATION: ${location}`,
			'OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01',
			`01-NLS: ${uuid}`,
			`SERVER: ${os.type()}/${os.release()} UPnP/1.0 Node/1.0`,
			`ST: ${target}`,
			`USN: uuid:${serial}::${target}`,
			'',
			''
		].join('\r\n');
	}

	onMessage(message, rinfo){

		const parsedMessage = this.parseMessage(message.toString());

		if(parsedMessage.type.indexOf('M-SEARCH *') === 0 && parsedMessage.mx && parsedMessage.st){
			const respondTime = Math.min(parseInt(parsedMessage.mx, 10), 5);

			this.devices.forEach((device) => {

				if(device.target === parsedMessage.st){

					const payload = this.searchResponse(device.target, device.location, device.uuid, device.serial);
					const buffer = Buffer.from(payload);

					// console.log(payload);

					setTimeout(() => {
						this.socket.send(payload, 0, payload.length, rinfo.port, rinfo.address);
					}, respondTime * 1000);
				}
			});
		}
	}
}

module.exports = SsdpServer;