# GIS Dashboard API Integration Document

This document provides a comprehensive audit, integration overview, and implementation details for all frontend API integrations used by the GIS Telemetry Dashboard. It also details the design specifications for the future backend telemetry microservice.

---

## 1. Feature Audits

### 1.1 Map Layers & Live Sensors
* **Feature**: Map Layers & Live Sensors
* **Backend Endpoint**: 
  - `GET /metadata-api/sensors` (Metadata Service)
  - `GET /disaster-management/alerts/active` (Alerting Service)
* **Purpose**: Fetches the list of all deployed sensors, their locations, thresholds, and cross-references active alerts to determine their real-time severity level for map marker color-coding.
* **Frontend Call Chain**:
  1. `GisDashboard.tsx` calls `fetchSensors()` inside a `useEffect` hook.
  2. `fetchSensors` invokes `getMapSensors()` defined in `src/services/gisTelemetryApi.ts`.
  3. `getMapSensors` makes parallel requests using `metadataApi.get('/sensors')` and `alertsApi.get('/active')`.
  4. The returned data is mapped and formatted into the frontend `Sensor` shape and returned to the component state (`sensors`).
* **Files Involved**:
  - [GisDashboard.tsx](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/pages/GisDashboard.tsx)
  - [gisTelemetryApi.ts](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/services/gisTelemetryApi.ts)
* **Request Details**:
  - **Method**: `GET`
  - **Headers**:
    - `Accept: application/json`
  - **Query Parameters**: None
  - **Path Parameters**: None
  - **Body**: None
  - **Example Request**:
    `GET /metadata-api/sensors`
    `GET /disaster-management/alerts/active`
* **Expected Responses**:
  - **Sensors Metadata List** (`GET /metadata-api/sensors`):
    ```json
    [
      {
        "sensorId": "1001",
        "sensorType": {
          "sensorTypeId": 1,
          "type": "Water Level Sensor"
        },
        "site": {
          "siteId": 101,
          "siteName": "Kelani River Station 01"
        },
        "latitude": 6.9497,
        "longitude": 80.0150,
        "unitOfMeasure": "m",
        "thresholdLowWarning": 2.0,
        "thresholdLowCritical": 1.0,
        "thresholdHighWarning": 6.0,
        "thresholdHighCritical": 8.0
      }
    ]
    ```
    - *Fields Explanation*:
      - `sensorId`: String. Unique identifier of the sensor.
      - `sensorType`: Object containing type description (`type`) and type ID (`sensorTypeId`).
      - `site`: Object containing site name (`siteName`) and site ID (`siteId`).
      - `latitude` / `longitude`: Double. Geographic coordinates.
      - `unitOfMeasure`: String. Unit displayed on charts (e.g. `m`, `°C`).
      - `threshold[Low/High][Warning/Critical]`: Double. Warning and critical alert boundaries.
  - **Active Alerts List** (`GET /disaster-management/alerts/active`):
    ```json
    [
      {
        "alertId": "73c68ea2-124b-4b11-a8cf-8512f45ea2e1",
        "sensorId": "1001",
        "severity": "HIGH_CRITICAL",
        "measurement": 8.4,
        "threshold": 8.0,
        "timestamp": "2026-06-30T13:40:00Z",
        "firstCreatedAt": "2026-06-30T13:30:00Z"
      }
    ]
    ```
    - *Fields Explanation*:
      - `sensorId`: String. The sensor that triggered the alert.
      - `severity`: String. One of `HIGH_CRITICAL`, `HIGH_WARNING`, `LOW_WARNING`, `LOW_CRITICAL`.
* **Frontend Usage**:
  - **State Storage**: Stored in local component state `const [sensors, setSensors] = useState<Sensor[]>([])`.
  - **UI Render**:
    - Renders markers on the Leaflet Map (`<MapContainer>`).
    - Marker styling class is computed by passing the sensor object to `getSeverityClass(sensor)`.
    - Used in the search bar to filter sensors by ID or site name.
  - **Loading/Error States**:
    - A `loading` spinner is displayed while fetching sensors.
    - If the API fails, a console error is logged, and the system falls back to `MOCK_SENSORS` to keep the UI interactive.
* **Error Handling**:
  - Handles network timeouts or server crashes (HTTP 500, 503, connection refused).
  - Falling back to `MOCK_SENSORS` ensures the user is still presented with a map and simulated sensor data.

---

### 1.2 Telemetry Trend History
* **Feature**: Telemetry Trend History
* **Backend Endpoint**: `GET /gis-api/telemetry/{sensorId}` (Projected GIS Telemetry Microservice)
* **Purpose**: Retrieves time-series historical data points for a specific sensor over a chosen time range (1h, 24h, 7d, 30d) to plot telemetry graphs.
* **Frontend Call Chain**:
  1. User selects a sensor and the drawers opens. Choice of time range triggers `fetchTelemetry()`.
  2. `fetchTelemetry` invokes `getSensorTelemetry(sensor_id, timeRange)`.
  3. `getSensorTelemetry` makes a call to `gisTelemetryApi.get('/telemetry/' + id, { params: { range } })`.
  4. Formatted `TelemetryReading[]` data is stored in the component state (`telemetry`) and rendered in `TelemetryChart`.
* **Files Involved**:
  - [GisDashboard.tsx](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/pages/GisDashboard.tsx)
  - [gisTelemetryApi.ts](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/services/gisTelemetryApi.ts)
  - [TelemetryChart.tsx](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/components/UI/TelemetryChart.tsx)
* **Request Details**:
  - **Method**: `GET`
  - **Headers**:
    - `Accept: application/json`
  - **Query Parameters**:
    - `range`: String. Choices: `1h`, `24h`, `7d`, `30d`. Default: `24h`.
  - **Path Parameters**:
    - `sensorId`: Number/String. Unique sensor identifier.
  - **Body**: None
  - **Example Request**:
    `GET /gis-api/telemetry/1001?range=7d`
* **Expected Response**:
  ```json
  [
    {
      "sensorId": "1001",
      "timestamp": "2026-06-30T12:00:00Z",
      "measurement": 5.2,
      "sensorHealth": 94.0
    },
    {
      "sensorId": "1001",
      "timestamp": "2026-06-30T12:30:00Z",
      "measurement": 5.8,
      "sensorHealth": 93.0
    }
  ]
  ```
  - *Fields Explanation*:
    - `sensorId`: String. Unique sensor ID.
    - `timestamp`: String (ISO-8601). Time of telemetry recording.
    - `measurement`: Double. Numerical sensor reading.
    - `sensorHealth`: Double/Integer. Battery level or physical state (0 - 100).
* **Frontend Usage**:
  - **State Storage**: Stored in `const [telemetry, setTelemetry] = useState<TelemetryReading[]>([])`.
  - **UI Render**:
    - Fed to the `<TelemetryChart>` component.
    - Apache ECharts maps the `timestamp` to the X-axis and `measurement` to the Y-axis.
    - The latest battery status (`battery_status`) is extracted and rendered in the sidebar drawer statistics card.
  - **Loading/Error States**:
    - Displays `<Spin>` or custom drawer loader during fetching.
    - If the microservice is offline or return errors, it catches the error, logs a warning, and falls back to dynamic mock generator `generateMockTelemetry` to prevent breaking the chart in the UI.
* **Error Handling**:
  - Catch block detects failure (HTTP 404, 500, 504, or Network Error).
  - Gracefully falls back to simulated data, rendering realistic waves based on the sensor's defined warning/critical thresholds.

---

## 2. Integration Summary Table

| Feature | Endpoint | Implemented Before | Implemented Now | Files Modified |
| :--- | :--- | :---: | :---: | :--- |
| **Map Layers & Live Sensors** | `GET /metadata-api/sensors` | No (mocked) | **Yes** | [gisTelemetryApi.ts](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/services/gisTelemetryApi.ts) |
| **Marker Severity Overlay** | `GET /disaster-management/alerts/active` | No (modulo logic) | **Yes** | [gisTelemetryApi.ts](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/services/gisTelemetryApi.ts), [GisDashboard.tsx](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/pages/GisDashboard.tsx) |
| **Telemetry History** | `GET /gis-api/telemetry/{sensorId}` | No (mocked) | **Yes** (Client code built; falls back to mock) | [gisTelemetryApi.ts](file:///c:/Users/avawe/Downloads/phase2repos2yp/disaster-management-frontend/src/services/gisTelemetryApi.ts) |

---

## 3. Architecture Overview

The frontend interacts with the backend services through an asynchronous request model backed by Axios client instances. The proxy routing architecture handles URL dispatching to the respective microservices:

```mermaid
graph TD
  subgraph Client [Browser / React Frontend]
    GisDash["GisDashboard.tsx"]
    Chart["TelemetryChart.tsx"]
    gisTelemetryApi["gisTelemetryApi.ts"]
    GisDash -->|useEffects / fetch| gisTelemetryApi
    GisDash -->|props| Chart
  end

  subgraph Gateway [Vite DevServer / Nginx Proxy]
    Proxy["Proxy Rule (/metadata-api, /disaster-management, /gis-api)"]
  end

  subgraph Microservices [Backend Microservices]
    MetadataSvc["Metadata Service (Port 8092)<br>Context: /metadata-api"]
    AlertsSvc["Alerting Service (Port 8093)<br>Context: /disaster-management"]
    GisSvc["Future GIS Telemetry Microservice (Port 8091)<br>Context: /gis-api"]
  end

  subgraph Database [PostgreSQL / TimescaleDB Database]
    DB[("Database: kernelx")]
  end

  gisTelemetryApi -->|GET /metadata-api/sensors| Proxy
  gisTelemetryApi -->|GET /disaster-management/alerts/active| Proxy
  gisTelemetryApi -->|GET /gis-api/telemetry/{sensorId}| Proxy

  Proxy -->|Forward to localhost:8092| MetadataSvc
  Proxy -->|Forward to localhost:8093| AlertsSvc
  Proxy -->|Forward to localhost:8091| GisSvc

  MetadataSvc -->|Read/Write| DB
  AlertsSvc -->|Read/Write| DB
  GisSvc -->|Query Time-Series| DB
```

### 3.1 Network Details
1. **Proxy Configurations**:
   - In Development: Vite configuration in `vite.config.js` routes requests:
     - `/metadata-api/` -> `http://localhost:8092/`
     - `/disaster-management/` -> `http://localhost:8093/`
     - `/gis-api/` -> `http://localhost:8091/` (Needs to be added when implementing the future microservice)
   - In Production: Nginx reverse-proxies requests at `nginx.conf`:
     - `/metadata-api/` -> `http://metadata-service:8080/`
     - `/disaster-management/` -> `http://alerting-service:8080/`
     - `/gis-api/` -> `http://gis-telemetry-service:8080/`
2. **CORS (Cross-Origin Resource Sharing)**:
   - Since requests are routed through a reverse proxy/Vite dev server, they share the same origin as the frontend. This prevents cross-origin requests, avoiding CORS configuration issues.
3. **Authentication**:
   - The current API endpoints are public. If authentication is added in the future, standard Axios interceptors should be configured to inject JWT Bearer tokens in headers.

---

## 4. Future Backend Microservice Specifications

To support telemetry history visualizations in the GIS Dashboard without mock data, a dedicated backend service must be developed.

### 4.1 Recommended Technology Stack
- **Framework**: Spring Boot (Java) or NestJS (NodeJS) / FastAPI (Python).
- **Database**: TimescaleDB or PostgreSQL (since the existing project uses PostgreSQL `kernelx` with TimescaleDB compatibility in the ingestion service).

### 4.2 Database Schema (TimescaleDB / PostgreSQL)
The service will read from the existing `sensor_reading` table created by the `MQTT-Telemetry-Ingestion-Service`.

```sql
-- Table structure already populated by the ingestion service
CREATE TABLE sensor_reading (
    sensor_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    measurement DOUBLE PRECISION NOT NULL,
    battery_status INTEGER,
    PRIMARY KEY (sensor_id, timestamp)
);

-- Convert to a hypertable for timeseries optimization (TimescaleDB)
SELECT create_hypertable('sensor_reading', 'timestamp', if_not_exists => TRUE);

-- Index for high-performance retrieval
CREATE INDEX idx_sensor_telemetry ON sensor_reading(sensor_id, timestamp DESC);
```

### 4.3 REST Controller Endpoints

#### `GET /gis-api/telemetry/{sensorId}`

- **Description**: Returns all historical telemetry points for a specific sensor over a chosen time window.
- **Request Parameters**:
  - `sensorId` (Path Variable): String.
  - `range` (Query Parameter, Optional): String. Values: `1h`, `24h`, `7d`, `30d`. Default: `24h`.
- **Query Mapping Logic**:
  ```java
  Instant startTime;
  Instant now = Instant.now();
  switch (range.toLowerCase()) {
      case "1h":
          startTime = now.minus(1, ChronoUnit.HOURS);
          break;
      case "7d":
          startTime = now.minus(7, ChronoUnit.DAYS);
          break;
      case "30d":
          startTime = now.minus(30, ChronoUnit.DAYS);
          break;
      case "24h":
      default:
          startTime = now.minus(24, ChronoUnit.HOURS);
          break;
  }
  return repository.findBySensorIdAndTimestampAfterOrderByTimestampAsc(sensorId, startTime);
  ```
- **Response Format**:
  - Status Code: `200 OK`
  - Body (JSON Array of readings):
    ```json
    [
      {
        "sensorId": "1001",
        "timestamp": "2026-06-30T12:00:00Z",
        "measurement": 5.2,
        "sensorHealth": 94.0
      }
    ]
    ```

### 4.4 Query Performance Guidelines
- **Timeseries Compaction**: Enable TimescaleDB compression policies for telemetry older than 7 days to minimize disk consumption.
- **Downsampling**: For ranges such as `30d`, apply downsampling (e.g. using `time_bucket()` in TimescaleDB) to return an average reading per hour rather than raw high-frequency points. This avoids overloading ECharts:
  ```sql
  SELECT time_bucket('1 hour', timestamp) AS bucket,
         avg(measurement) AS measurement,
         avg(battery_status) AS sensorHealth
  FROM sensor_reading
  WHERE sensor_id = :sensorId AND timestamp > :startTime
  GROUP BY bucket
  ORDER BY bucket ASC;
  ```

---

## 5. Future Debugging Guide

When working on the GIS Dashboard and its API integrations, use these steps to diagnose issues:

### 5.1 DevTools Inspection (Frontend)
1. **Network tab**:
   - Verify that requests to `/metadata-api/sensors` and `/disaster-management/alerts/active` resolve with status code `200 OK`.
   - Verify that the projected `/gis-api/telemetry/{id}` requests are firing correctly on choosing time ranges in the drawer.
2. **Console tab**:
   - Look for `"Error fetching map sensors, falling back to mock data:"` warnings.
   - Look for `"Failed to fetch telemetry from future microservice..."` messages. These logs indicate that the frontend is running in mock fallback mode.
3. **ECharts Resize Warnings**:
   - If the ECharts canvas does not fit the drawer, check that the ECharts wrapper div height is set properly and the `resize()` listener in `TelemetryChart.tsx` is registered.

### 5.2 Common Points of Failure
- **Vite Proxy Mismatch**: If you see HTTP 404 for `/metadata-api/sensors`, ensure the Vite dev server is running and the proxy rules in `vite.config.js` match the active port of the Spring Boot Metadata service (default `8092`).
- **Database Connection Terminated**: If the Spring Boot backend runs but endpoints throw HTTP 500, verify the Postgres database `kernelx` is active and reachable via `psql -U kernelx -d kernelx`.
- **Date Parsing Issues**: If the ECharts graph is blank or displays invalid dates, check that `timestamp` in the JSON response is ISO-8601 compliant (`YYYY-MM-DDTHH:mm:ss.sssZ`).
