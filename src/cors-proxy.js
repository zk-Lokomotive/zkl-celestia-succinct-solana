// CORS Proxy Server for Celestia
const cors_proxy = require('cors-anywhere');

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = parseInt(process.env.PORT || '8080', 10);

cors_proxy.createServer({
  originWhitelist: [], // Yalnızca geliştirme ortamı için, tüm kaynaklara izin ver
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
  console.log('CORS Proxy sunucusu şurada başlatıldı: ' + host + ':' + port);
}); 