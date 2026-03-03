---
id: docker-compose-networking
title: Docker Compose Networking
tags: [docker, networking, containers]
category: tech
created: 2026-02-12
source: manual
---

# Docker Compose Networking

## Summary

How Docker Compose handles networks, how containers find each other, and when to use host vs bridge networking.

## Details

### Default Network

When you run `docker compose up`, all services in the same `docker-compose.yml` are on the same default bridge network. Containers can reach each other by service name.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres:16
    # api can reach this at "db:5432"
```

### Named Networks

Use named networks when you need to connect services across different compose files:

```yaml
services:
  app:
    networks:
      - frontend
      - backend

networks:
  frontend:
    name: shared-frontend
  backend:
    name: shared-backend
```

Other compose files can join `shared-frontend` or `shared-backend` by name.

### Host Networking

`network_mode: host` makes the container share the host's network stack. The container can reach anything the host can, but port mapping doesn't apply — the container uses host ports directly.

Useful for: services that need to bind to multiple ports, or talk to localhost services.

### Common Gotcha

`localhost` inside a container refers to the container, not the host. To reach a service on the host, use `host.docker.internal` (Mac/Windows) or the host's gateway IP on Linux (check with `docker network inspect bridge | grep Gateway`).
