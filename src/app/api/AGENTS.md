# API route guidance

- Authenticate, validate, call one service, and map errors to the shared response contract.
- Return stable machine codes and safe messages with a request ID.
- Never expose provider errors, SQL, stack traces, content, tokens, or secrets.
- Apply per-user rate limits to expensive or destructive operations.
