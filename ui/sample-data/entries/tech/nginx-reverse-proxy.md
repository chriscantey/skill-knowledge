---
id: nginx-reverse-proxy
title: Nginx Reverse Proxy Configuration
tags: [nginx, proxy, docker, networking]
category: tech
created: 2026-02-10
source: manual
---

# Nginx Reverse Proxy Configuration

## Summary

How to configure nginx as a reverse proxy. Key gotcha: trailing slash on `proxy_pass` matters for path stripping.

## Details

### Basic Proxy Block

```nginx
location /app/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Trailing Slash Rule

The trailing slash on `proxy_pass` determines whether nginx strips the location prefix:

- `proxy_pass http://localhost:3000/;` — strips `/app/` prefix before forwarding
- `proxy_pass http://localhost:3000;` — passes `/app/foo` as-is to the backend

Most setups want the trailing slash (strip the prefix).

### WebSocket Support

Add these headers to support WebSocket connections:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Docker Compose Integration

When the backend is a Docker container on the same host, use the container name as the hostname (if nginx is also in Docker on the same network):

```nginx
proxy_pass http://my-app:3000/;
```

Or use `host.docker.internal` to reach the host from within a container.
