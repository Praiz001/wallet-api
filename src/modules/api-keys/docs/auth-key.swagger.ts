import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

export const ApiKeysDocs = {
  create: () =>
    applyDecorators(
      ApiOperation({
        summary: "Create API Key",
        description:
          "Creates a new API key with specified permissions and expiry. Maximum 5 active keys per user. The API key is returned only once and cannot be retrieved later.",
      }),
      ApiBearerAuth("JWT"),
      ApiBody({
        schema: {
          type: "object",
          required: ["name", "permissions", "expiry"],
          properties: {
            name: {
              type: "string",
              example: "wallet-service",
              description: "Name for the API key",
            },
            permissions: {
              type: "array",
              items: {
                type: "string",
                enum: ["deposit", "transfer", "read"],
              },
              example: ["deposit", "transfer", "read"],
              description: "List of permissions for the API key",
            },
            expiry: {
              type: "string",
              enum: ["1H", "1D", "1M", "1Y"],
              example: "1D",
              description:
                "Expiry duration: 1H (hour), 1D (day), 1M (month), 1Y (year)",
            },
          },
        },
      }),
      ApiResponse({
        status: 201,
        description: "API key created successfully",
        schema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              example: "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
              description: "The API key (shown only once)",
            },
            expires_at: {
              type: "string",
              format: "date-time",
              example: "2025-12-10T12:00:00Z",
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: "Bad request - Maximum 5 active keys or invalid input",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              type: "string",
              example: "Maximum 5 active API keys allowed",
            },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing JWT token",
      }),
    ),

  rollover: () =>
    applyDecorators(
      ApiOperation({
        summary: "Rollover Expired API Key",
        description:
          "Creates a new API key using the same permissions as an expired key. The old key must be expired.",
      }),
      ApiBearerAuth("JWT"),
      ApiBody({
        schema: {
          type: "object",
          required: ["expired_key", "expiry"],
          properties: {
            expired_key: {
              type: "string",
              example: "sk_live_3ab9c4d0146f7c214055dbb2ad1e1d62",
              description: "The expired API key string",
            },
            expiry: {
              type: "string",
              enum: ["1H", "1D", "1M", "1Y"],
              example: "1M",
              description: "New expiry duration",
            },
          },
        },
      }),
      ApiResponse({
        status: 201,
        description: "API key rolled over successfully",
        schema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              example: "sk_live_new_key_here",
            },
            expires_at: {
              type: "string",
              format: "date-time",
              example: "2026-01-10T12:00:00Z",
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: "Bad request - Key not expired or invalid input",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              type: "string",
              example: "Key is not expired yet",
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "API key not found",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 404 },
            message: { type: "string", example: "API key not found" },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing JWT token",
      }),
    ),

  revoke: () =>
    applyDecorators(
      ApiOperation({
        summary: "Revoke API Key",
        description:
          "Revokes an active API key. Once revoked, the key can no longer be used for authentication. The key must belong to the authenticated user.",
      }),
      ApiBearerAuth("JWT"),
      ApiBody({
        schema: {
          type: "object",
          required: ["api_key"],
          properties: {
            api_key: {
              type: "string",
              example: "sk_live_3ab9c4d0146f7c214055dbb2ad1e1d62",
              description: "The API key string to revoke",
            },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: "API key revoked successfully",
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "API key revoked successfully",
            },
            revoked_at: {
              type: "string",
              format: "date-time",
              example: "2025-12-10T15:30:00Z",
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: "Bad request - Invalid API key provided",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              type: "string",
              example: "Invalid API key provided",
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "API key not found",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 404 },
            message: { type: "string", example: "API key not found" },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing JWT token",
      }),
    ),
};
