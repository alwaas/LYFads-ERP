// Standard Success Response Format
{
  "success": true,
  "status_code": 200,
  "message": "Operation completed successfully",
  "data": {
    // Payload data here
  },
  "timestamp": "2026-06-06T12:00:00Z"
}

// Standard Error Response Format
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "INVALID_TENANT_CONTEXT",
    "message": "The provided tenant token is invalid or expired."
  },
  "timestamp": "2026-06-06T12:00:00Z"
}