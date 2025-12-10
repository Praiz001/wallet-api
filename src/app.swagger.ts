import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

export const AppDocs = {
  welcome: () =>
    applyDecorators(
      ApiOperation({
        summary: "Welcome",
        description: "Welcome message and API information",
      }),
      ApiResponse({
        status: 200,
        description: "Welcome message",
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Welcome to Wallet API",
            },
            docs: {
              type: "string",
              example: "Please check /docs for API documentation",
            },
            version: {
              type: "string",
              example: "1.0.0",
            },
          },
        },
      }),
    ),

  health: () =>
    applyDecorators(
      ApiOperation({
        summary: "Health Check",
        description: "Check if the API service is running and healthy",
      }),
      ApiResponse({
        status: 200,
        description: "Service is healthy",
        schema: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-12-09T10:30:00.000Z",
            },
            service: { type: "string", example: "Wallet Service API" },
          },
        },
      }),
    ),
};
