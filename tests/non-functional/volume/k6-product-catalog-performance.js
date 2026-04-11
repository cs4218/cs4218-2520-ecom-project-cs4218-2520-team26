import http from "k6/http";
import { check, sleep } from "k6";

// Earnest Suprapmo, A0251966U

/**
 * High-data-volume performance test for product catalog & search.
 *
 * Assumptions:
 * - API server is running and reachable at BASE_URL (see env below).
 * - Database has already been seeded with ~100k products using
 *   tests/non-functional/volume/scripts/seed-volume-products.js.
 *
 * This script exercises:
 * - Product pagination (GET /api/v1/product/product-list/:page)
 * - Product count (GET /api/v1/product/product-count)
 * - Text search (GET /api/v1/product/search/:keyword)
 * - Category-based filtering and price ranges (POST /api/v1/product/product-filters)
 *
 * Latency is validated through k6 thresholds; memory behavior should be
 * observed from the application side (Node.js / MongoDB metrics) while
 * this script is running.
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// Use search keywords matching seeded data.
const SEARCH_KEYWORDS = [
  "volume",
  "product",
  "electronics",
  "kitchen",
  "sports",
];

// Example category IDs used for filter tests.
// Replace with real ObjectIds from your DB if needed.
// When left empty, the filter test will only use price ranges.
const CATEGORY_IDS = (__ENV.CATEGORY_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

// Price ranges used in filter tests [min, max].
const PRICE_RANGES = [
  [0, 50],
  [50, 200],
  [200, 1000],
  [1000, 5000],
];

export const options = {
  scenarios: {
    // Users browsing paginated product lists.
    browse_products: {
      executor: "ramping-vus",
      exec: "browseProducts",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },

    // Users searching by keyword.
    search_products: {
      executor: "ramping-vus",
      exec: "searchProducts",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 30 },
        { duration: "30s", target: 0 },
      ],
      startTime: "10s",
    },

    // Users applying filters and pagination.
    filter_and_paginate: {
      executor: "ramping-vus",
      exec: "filterAndPaginate",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 30 },
        { duration: "30s", target: 0 },
      ],
      startTime: "20s",
    },
  },

  thresholds: {
    // General success rate.
    http_req_failed: ["rate<0.01"], // <1% of requests should fail.

    // Overall latency.
    http_req_duration: ["p(95)<700"], // 95th percentile under 700ms across all scenarios.

    // Per-scenario latency budgets.
    "http_req_duration{scenario:browse_products}": ["p(95)<500"],
    "http_req_duration{scenario:search_products}": ["p(95)<600"],
    "http_req_duration{scenario:filter_and_paginate}": ["p(95)<700"],
  },
};

export function browseProducts() {
  // Query product count once in a while via a lightweight call.
  const countRes = http.get(`${BASE_URL}/api/v1/product/product-count`);
  check(countRes, {
    "product count status is 200": (r) => r.status === 200,
  });

  // Use a simple heuristic: assume there are many pages and randomly pick one.
  const page = Math.floor(Math.random() * 100) + 1; // 1..100
  const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`);

  check(res, {
    "browse status is 200": (r) => r.status === 200,
    "browse payload contains products": (r) => {
      try {
        const body = r.json();
        return (
          body &&
          body.success === true &&
          Array.isArray(body.products) &&
          body.products.length <= 6
        );
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}

export function searchProducts() {
  const keyword =
    SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];

  const res = http.get(`${BASE_URL}/api/v1/product/search/${encodeURIComponent(keyword)}`);

  check(res, {
    "search status is 200": (r) => r.status === 200,
    "search returns array of products": (r) => {
      try {
        const body = r.json();
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}

export function filterAndPaginate() {
  // Build filter payload with optional categories and a random price range.
  const range =
    PRICE_RANGES[Math.floor(Math.random() * PRICE_RANGES.length)];

  const payload = {
    checked: CATEGORY_IDS.length
      ? [CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)]]
      : [],
    radio: range,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const filterRes = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    JSON.stringify(payload),
    { headers }
  );

  check(filterRes, {
    "filter status is 200": (r) => r.status === 200,
    "filter returns products array": (r) => {
      try {
        const body = r.json();
        return (
          body &&
          body.success === true &&
          Array.isArray(body.products)
        );
      } catch {
        return false;
      }
    },
  });

  // After filtering, also hit a paginated list to stress indexes further.
  const page = Math.floor(Math.random() * 100) + 1;
  const listRes = http.get(
    `${BASE_URL}/api/v1/product/product-list/${page}`
  );

  check(listRes, {
    "filter scenario list status is 200": (r) => r.status === 200,
  });

  sleep(0.5);
}

