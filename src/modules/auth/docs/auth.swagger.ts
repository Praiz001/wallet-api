import { applyDecorators } from "@nestjs/common";

import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

export const ApiAuthDocs = {
  googleAuth: () =>
    applyDecorators(
      ApiTags("Authentication"),
      ApiOperation({
        summary: "Initiate Google OAuth",
        description: `Redirects user to Google OAuth consent screen. User must complete authentication on Google.\n\n**Note:** This endpoint cannot be tested through Swagger UI due to OAuth redirect flow. Please test by visiting the URL directly in your browser: \`${getBaseUrl()}/auth/google\``,
      }),
      ApiResponse({
        status: 302,
        description: "Redirects to Google OAuth",
      }),
    ),

  googleCallback: () =>
    applyDecorators(
      ApiTags("Authentication"),
      ApiOperation({
        summary: "Google OAuth Callback",
        description:
          "Handles Google OAuth callback after user authentication. Returns JWT token and user info. Automatically creates wallet for new users.",
      }),
      ApiResponse({
        status: 200,
        description: "Authentication successful",
        schema: {
          type: "object",
          properties: {
            access_token: {
              type: "string",
              example:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NmZiZWYxOS0wNzc2LTQ4ODEtODhlZS00NWQzMjVmNzIxYWIiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjUzMTg2OTcsImV4cCI6MTc2NTkyMzQ5N30.abc123",
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  example: "86fbef19-0776-4881-88ee-45d325f721ab",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Authentication failed",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 401 },
            message: { type: "string", example: "Unauthorized" },
          },
        },
      }),
    ),
};
const getBaseUrl = (): string => {
  return process.env.BASE_URL || "http://localhost:3000";
};
