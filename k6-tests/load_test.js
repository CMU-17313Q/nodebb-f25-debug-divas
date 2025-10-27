import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 3,             // number of virtual users
  duration: "5s",     // total run time
  thresholds: {
    http_req_failed: ["rate<0.05"],    // <5% requests fail
    http_req_duration: ["p(95)<1000"], // 95% under 1s
  },
};

export default function () {
  const res = http.get("https://test.k6.io/");
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
