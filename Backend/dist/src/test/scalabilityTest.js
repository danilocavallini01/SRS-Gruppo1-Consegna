"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('k6/http');
module.exports.options = {
    stages: [
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 300 },
    ],
};
module.exports.default = function () {
    http.post('http://localhost:8000/api/generate', JSON.stringify({
        code: 'resource "..." {}',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
/*
module.exports.default = function () {
  http.post('http://localhost:8000/api/preview', JSON.stringify({
    code: 'resource "..." {}',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

module.exports.default = function () {
  http.post('http://localhost:8000/api/confirm', JSON.stringify({
    code: 'resource "..." {}',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
*/ 
