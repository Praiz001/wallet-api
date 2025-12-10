import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";

export const WalletDocs = {
  deposit: () =>
    applyDecorators(
      ApiOperation({
        summary: "Initiate Deposit",
        description:
          "Initialize a Paystack payment transaction. Returns authorization URL for user to complete payment. Requires deposit permission.",
      }),
      ApiBearerAuth("JWT"),
      ApiBody({
        schema: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: {
              type: "number",
              example: 5000,
              description: "Amount to deposit in Naira",
              minimum: 1,
            },
          },
        },
      }),
      ApiResponse({
        status: 201,
        description: "Deposit initialized successfully",
        schema: {
          type: "object",
          properties: {
            reference: {
              type: "string",
              example:
                "DEP_86fbef19-0776-4881-88ee-45d325f721ab_1765318697490_10a54b41",
            },
            authorization_url: {
              type: "string",
              format: "uri",
              example: "https://checkout.paystack.com/xxxxxxxxx",
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: "Bad request - Invalid amount",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              type: "string",
              example: "Amount must be greater than 0",
            },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing authentication",
      }),
      ApiResponse({
        status: 403,
        description: "Forbidden - Missing deposit permission",
      }),
    ),

  transfer: () =>
    applyDecorators(
      ApiOperation({
        summary: "Transfer Funds",
        description:
          "Transfer money from your wallet to another user's wallet. Atomic operation - both debit and credit succeed or both fail. Requires transfer permission.",
      }),
      ApiBearerAuth("JWT"),
      ApiBody({
        schema: {
          type: "object",
          required: ["wallet_number", "amount"],
          properties: {
            wallet_number: {
              type: "string",
              example: "1234567890123",
              description: "13-digit wallet number of recipient",
              pattern: "^[0-9]{13}$",
            },
            amount: {
              type: "number",
              example: 3000,
              description: "Amount to transfer in Naira",
              minimum: 1,
            },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: "Transfer completed successfully",
        schema: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "Transfer completed" },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: "Bad request - Invalid input or insufficient balance",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              type: "string",
              example: "Insufficient balance",
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "Recipient wallet not found",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 404 },
            message: { type: "string", example: "Recipient wallet not found" },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing authentication",
      }),
      ApiResponse({
        status: 403,
        description: "Forbidden - Missing transfer permission",
      }),
    ),

  getBalance: () =>
    applyDecorators(
      ApiOperation({
        summary: "Get Wallet Balance",
        description:
          "Get current balance of authenticated user's wallet. Requires read permission.",
      }),
      ApiBearerAuth("JWT"),
      ApiResponse({
        status: 200,
        description: "Balance retrieved successfully",
        schema: {
          type: "object",
          properties: {
            balance: {
              type: "number",
              example: 15000.5,
              description: "Current wallet balance in Naira",
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "Wallet not found",
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing authentication",
      }),
      ApiResponse({
        status: 403,
        description: "Forbidden - Missing read permission",
      }),
    ),

  getTransactions: () =>
    applyDecorators(
      ApiOperation({
        summary: "Get Transaction History",
        description:
          "Get paginated transaction history for authenticated user's wallet. Includes deposits, transfers in, and transfers out.",
      }),
      ApiBearerAuth("JWT"),
      ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        example: 50,
        description: "Number of transactions to return (default: 50)",
      }),
      ApiQuery({
        name: "offset",
        required: false,
        type: Number,
        example: 0,
        description: "Pagination offset (default: 0)",
      }),
      ApiResponse({
        status: 200,
        description: "Transactions retrieved successfully",
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              type: {
                type: "string",
                enum: ["deposit", "transfer_in", "transfer_out"],
                example: "deposit",
              },
              amount: {
                type: "number",
                example: 5000,
                description:
                  "Positive for deposits/transfers in, negative for transfers out",
              },
              status: {
                type: "string",
                enum: ["pending", "success", "failed"],
                example: "success",
              },
              reference: {
                type: "string",
                example:
                  "DEP_86fbef19-0776-4881-88ee-45d325f721ab_1765318697490_10a54b41",
              },
              metadata: {
                type: "object",
                nullable: true,
                example: {
                  recipient_wallet_number: "1234567890123",
                },
              },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2025-12-09T10:30:00.000Z",
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "Wallet not found",
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing JWT token",
      }),
    ),

  getDepositStatus: () =>
    applyDecorators(
      ApiOperation({
        summary: "Get Deposit Status",
        description:
          "Check the status of a deposit transaction by reference. Does not credit wallet - only webhook credits wallets.",
      }),
      ApiBearerAuth("JWT"),
      ApiParam({
        name: "reference",
        type: "string",
        example:
          "DEP_86fbef19-0776-4881-88ee-45d325f721ab_1765318697490_10a54b41",
        description: "Transaction reference",
      }),
      ApiResponse({
        status: 200,
        description: "Deposit status retrieved",
        schema: {
          type: "object",
          properties: {
            reference: {
              type: "string",
              example:
                "DEP_86fbef19-0776-4881-88ee-45d325f721ab_1765318697490_10a54b41",
            },
            status: {
              type: "string",
              enum: ["pending", "success", "failed"],
              example: "success",
            },
            amount: {
              type: "number",
              example: 5000,
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: "Transaction not found",
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 404 },
            message: { type: "string", example: "Transaction not found" },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: "Unauthorized - Invalid or missing authentication",
      }),
      ApiResponse({
        status: 403,
        description: "Forbidden - Missing read permission",
      }),
    ),

  webhook: () =>
    applyDecorators(
      ApiExcludeEndpoint(),
      ApiOperation({
        summary: "Paystack Webhook",
        description:
          "Internal endpoint for Paystack webhook callbacks. Not for public use.",
      }),
    ),
};
