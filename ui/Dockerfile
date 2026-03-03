FROM oven/bun:1-slim

WORKDIR /app

# Copy server
COPY server.ts .

# Install dependencies (none needed for this minimal server, but future-proofing)
# RUN bun install

EXPOSE 8080

CMD ["bun", "run", "server.ts"]
