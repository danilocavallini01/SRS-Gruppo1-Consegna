// @ts-check
const http = require('k6/http');
const k6 = require('k6');
module.exports.options = {
    stages: [
        { duration: '1m', target: 100 }, // ramp up
        { duration: '2m', target: 100 }, // steady
        { duration: '1m', target: 0 }, // ramp down
    ],
};
module.exports.default = function () {
    const res = http.post('http://localhost:8000/api/generate', JSON.stringify({
        code: "resource google_compute_instance 'vm' {...}"
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
    k6.check(res, {
        'status is 200': (r) => r.status === 200,
        'duration < 500ms': (r) => r.timings.duration < 500
    });
    k6.sleep(1);
};
export {};
/*
module.exports.default = function () {
  const res = http.post('http://localhost:8000/api/preview', JSON.stringify({
    code: 'resource "..." {}',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

module.exports.default = function () {
  const res =  http.post('http://localhost:8000/api/confirm', JSON.stringify({
    code: 'resource "..." {}',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
*/ 
