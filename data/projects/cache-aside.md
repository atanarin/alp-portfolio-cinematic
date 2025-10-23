Cache-Aside Example — a lightweight demonstration of read-through caching patterns for modern web apps.  
I built a FastAPI + SQLAlchemy backend connected to Redis to illustrate cache-aside and invalidation strategies.  
When a GET request occurs, the service first checks Redis, then falls back to the database if the key is missing.  
On writes or updates, the app commits to the DB and deletes the cached entry to avoid stale data.  
The demo includes TTLs (time-to-live) for automatic cache expiry and a simple lock for stampede protection.  
It mirrors production techniques used to reduce database load and latency in scalable systems.  
The project emphasizes observability—logging cache hits, misses, and invalidations for benchmarking.  
This pattern forms the basis for many real-world high-throughput APIs and e-commerce backends.
