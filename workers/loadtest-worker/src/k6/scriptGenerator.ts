export interface K6JobConfig {
  loadTestId: string;
  targetUrl: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  authConfig?: any;
  vus: number;
  durationSeconds: number;
  rampUpSeconds: number;
  steadyStateSeconds: number;
  rampDownSeconds: number;
  thresholds: Array<{ metric: string; operator: string; value: number }>;
}

export function generateK6Script(config: K6JobConfig): string {
  const method = config.method.toUpperCase();
  const headers = {
    'User-Agent': 'APIForge-k6-Worker/1.0',
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  };

  // Build k6 thresholds object
  const thresholdObj: Record<string, string[]> = {};
  for (const t of config.thresholds || []) {
    let metricKey = t.metric;
    if (metricKey === 'http_req_duration_p95') metricKey = 'http_req_duration{p95}';
    if (metricKey === 'http_req_duration_p99') metricKey = 'http_req_duration{p99}';
    if (metricKey === 'http_req_duration_avg') metricKey = 'http_req_duration{avg}';
    if (metricKey === 'http_req_failed') metricKey = 'http_req_failed';

    const rule = `${t.operator} ${t.value}`;
    if (!thresholdObj[metricKey]) {
      thresholdObj[metricKey] = [];
    }
    thresholdObj[metricKey].push(rule);
  }

  // Stages
  const stages = [];
  if (config.rampUpSeconds > 0) {
    stages.push({ duration: `${config.rampUpSeconds}s`, target: config.vus });
  }
  stages.push({ duration: `${config.steadyStateSeconds}s`, target: config.vus });
  if (config.rampDownSeconds > 0) {
    stages.push({ duration: `${config.rampDownSeconds}s`, target: 0 });
  }

  const payloadString = config.body
    ? typeof config.body === 'string'
      ? JSON.stringify(config.body)
      : JSON.stringify(JSON.stringify(config.body))
    : 'null';

  return `
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    apiforge_scenario: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: ${JSON.stringify(stages, null, 2)},
      gracefulRampDown: '5s',
    },
  },
  thresholds: ${JSON.stringify(thresholdObj, null, 2)},
};

const TARGET_URL = ${JSON.stringify(config.targetUrl)};
const HEADERS = ${JSON.stringify(headers, null, 2)};
const PAYLOAD = ${payloadString};

export default function () {
  let res;
  const params = { headers: HEADERS, timeout: '10s' };

  if ('${method}' === 'GET') {
    res = http.get(TARGET_URL, params);
  } else if ('${method}' === 'POST') {
    res = http.post(TARGET_URL, PAYLOAD, params);
  } else if ('${method}' === 'PUT') {
    res = http.put(TARGET_URL, PAYLOAD, params);
  } else if ('${method}' === 'DELETE') {
    res = http.del(TARGET_URL, PAYLOAD, params);
  } else if ('${method}' === 'PATCH') {
    res = http.patch(TARGET_URL, PAYLOAD, params);
  } else {
    res = http.get(TARGET_URL, params);
  }

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'status not 5xx': (r) => r.status < 500,
  });

  sleep(0.1);
}
`;
}
