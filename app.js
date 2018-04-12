const SsdpServer = require('./SsdpServer.js');
const WemoDevice = require('./WemoDevice.js');
const HueDevice = require('./HueDevice.js');

const wemo = new WemoDevice('Wohnzimmer', 60015);

wemo.on('change', (state) => {
	console.log(`Device ${wemo.name}: ${state}`);
});

const devices = [
	wemo
	// new HueDevice('Wohnzimmer', 60015)
];

const server = new SsdpServer(devices);
server.start();