"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('k6/http');
const k6 = require('k6');
module.exports.options = {
    stages: [
        //   { duration: '1m', target: 50 },
        //   { duration: '1m', target: 100 },
        //   { duration: '1m', target: 200 }, // max 
        { duration: '30s', target: 0 }, // ramp down
    ],
};
module.exports.default = function () {
    const res = http.post('http://localhost:8000/api/generate', JSON.stringify({
        code: 'resource "..." {}',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
    k6.check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 1s': (r) => r.timings.duration < 1000,
    });
    k6.sleep(1);
};
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
