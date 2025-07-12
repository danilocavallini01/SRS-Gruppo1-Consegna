const http = require('k6/http');
const k6 = require('k6');
let prod = false
let URI = "https://node-backend-pkkemnazlq-og.a.run.app/";
if (prod === true) {
  URI = "PRDUCTION_URL";
} 
// OPTIONS for scalability
export let options = {
  stages: [
    { duration: '5s', target: 50 },  
    { duration: '10s', target: 50 }, 
    { duration: '2s', target: 250 }, 
    { duration: '1m', target: 300 },
    { duration: '2s', target: 50 },  
    { duration: '10s', target: 50 }, 
    { duration: '5s', target: 0 },   
  ],
};

// You can load credentials dynamically if needed
const credentials = {
  email: "test@gmail.com",
  password: "aaaa",
};

// LOGIN FUNCTION (executed once per VU)
function login() {
  
  const res = http.post(URI+'auth/login', JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' },
  });

  k6.check(res, {
    'login succeeded': (res) => res.status === 200 && res.json('token') !== undefined,
  });

  return res.json('token'); // Assuming response shape: { token: "..." }
}

// VU-LOCAL STORAGE (not shared between VUs)
let token;
let prompt = "Deploy a web application with a frontend and backend using Docker and Kubernetes.";

// DEFAULT FUNCTION (runs in loop for each VU)
export default function () {
  // First-time token acquisition per VU
  if (!token) {
    token = login();
  }

  const payload = JSON.stringify({
    prompt: prompt,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const res = http.post(URI+'api/generate', payload, { headers });
 
  k6.check(res, {
    'generate succeeded': (res) => res.status === 200,
   });
 
  k6.sleep(1); // optional pacing
}

export function handleSummary(data) {
  return {
    'SpikeSummary.json': JSON.stringify(data),
  };
}