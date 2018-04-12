const os = require('os');
const dgram = require('dgram');

class SsdpServer{

	constructor(devices){

		this.devices = devices;

		this.socket = dgram.createSocket({
			type: 'udp4',
			reuseAddr: true
		});

		this.socket.on('listening', this.onListening.bind(this));
		this.socket.on('message', this.onMessage.bind(this));
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
	}

	onMessage(message, rinfo){

		message = message.toString();
		const port = rinfo.port;

		// Echo Dot port is 50000
		// only respond tho Echo search
		if(port === 50000 && message.indexOf('M-SEARCH *') === 0){

			this.devices.forEach((device) => {

				const payload = device.discover();
				const buffer = Buffer.from(payload);

				setTimeout(() => { // little delay, seems to work better
					this.socket.send(payload, 0, payload.length, rinfo.port, rinfo.address);
				}, 1500);
			});
		}
	}
}

module.exports = SsdpServer;