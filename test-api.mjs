import handler from './api/deep-scrutiny.js';
const mockReq = { query: { symbol: 'TCS.NS' } };
const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('STATUS:', code);
      console.log('DATA:', JSON.stringify(data, null, 2));
    }
  })
};

(async () => {
  await handler(mockReq, mockRes);
})();
