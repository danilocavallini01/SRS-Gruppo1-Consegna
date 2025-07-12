const PROD = import.meta.env.PROD
console.log(PROD)
export const URI = PROD ? 'https://node-backend-pkkemnazlq-og.a.run.app' : 'http://localhost:8000'