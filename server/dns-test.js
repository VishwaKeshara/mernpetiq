import dns from 'node:dns';

dns.resolveSrv('_mongodb._tcp.cluster0.23zknzn.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV error:', err);
  } else {
    console.log('SRV records:', addresses);
  }
});