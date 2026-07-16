# Server guidance

- Keep business logic in services rather than route handlers.
- Authenticate on the server and never trust a client-supplied user ID.
- Treat Gmail content and model output as untrusted input.
- Keep provider clients request-scoped; do not retain user state in module-level clients.
- Add focused unit or integration tests for every backend behavior change.
