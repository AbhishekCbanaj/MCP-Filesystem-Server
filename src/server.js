#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

class FilesystemMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "filesystem-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create_file",
            description: "Create a new file with specified content",
            inputSchema: {
              type: "object",
              properties: {
                filepath: {
                  type: "string",
                  description: "Path where the file should be created",
                },
                content: {
                  type: "string",
                  description: "Content to write to the file",
                },
              },
              required: ["filepath", "content"],
            },
          },
          {
            name: "read_file",
            description: "Read the contents of a file",
            inputSchema: {
              type: "object",
              properties: {
                filepath: {
                  type: "string",
                  description: "Path of the file to read",
                },
              },
              required: ["filepath"],
            },
          },
          {
            name: "edit_file",
            description: "Edit an existing file by replacing its content",
            inputSchema: {
              type: "object",
              properties: {
                filepath: {
                  type: "string",
                  description: "Path of the file to edit",
                },
                content: {
                  type: "string",
                  description: "New content for the file",
                },
              },
              required: ["filepath", "content"],
            },
          },
          {
            name: "delete_file",
            description: "Delete a file",
            inputSchema: {
              type: "object",
              properties: {
                filepath: {
                  type: "string",
                  description: "Path of the file to delete",
                },
              },
              required: ["filepath"],
            },
          },
          {
            name: "list_files",
            description: "List all files in a directory",
            inputSchema: {
              type: "object",
              properties: {
                dirpath: {
                  type: "string",
                  description: "Path of the directory to list",
                },
              },
              required: ["dirpath"],
            },
          },
          {
            name: "create_directory",
            description: "Create a new directory",
            inputSchema: {
              type: "object",
              properties: {
                dirpath: {
                  type: "string",
                  description: "Path where the directory should be created",
                },
              },
              required: ["dirpath"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_file":
            return await this.createFile(args.filepath, args.content);
          
          case "read_file":
            return await this.readFile(args.filepath);
          
          case "edit_file":
            return await this.editFile(args.filepath, args.content);
          
          case "delete_file":
            return await this.deleteFile(args.filepath);
          
          case "list_files":
            return await this.listFiles(args.dirpath);
          
          case "create_directory":
            return await this.createDirectory(args.dirpath);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async createFile(filepath, content) {
    await fs.writeFile(filepath, content, "utf8");
    return {
      content: [
        {
          type: "text",
          text: `File created successfully at: ${filepath}`,
        },
      ],
    };
  }

  async readFile(filepath) {
    const content = await fs.readFile(filepath, "utf8");
    return {
      content: [
        {
          type: "text",
          text: `Content of ${filepath}:\n\n${content}`,
        },
      ],
    };
  }

  async editFile(filepath, content) {
    await fs.writeFile(filepath, content, "utf8");
    return {
      content: [
        {
          type: "text",
          text: `File edited successfully: ${filepath}`,
        },
      ],
    };
  }

  async deleteFile(filepath) {
    await fs.unlink(filepath);
    return {
      content: [
        {
          type: "text",
          text: `File deleted successfully: ${filepath}`,
        },
      ],
    };
  }

  async listFiles(dirpath) {
    const files = await fs.readdir(dirpath, { withFileTypes: true });
    const fileList = files.map(file => {
      return `${file.isDirectory() ? '[DIR]' : '[FILE]'} ${file.name}`;
    }).join('\n');
    
    return {
      content: [
        {
          type: "text",
          text: `Contents of ${dirpath}:\n\n${fileList}`,
        },
      ],
    };
  }

  async createDirectory(dirpath) {
    await fs.mkdir(dirpath, { recursive: true });
    return {
      content: [
        {
          type: "text",
          text: `Directory created successfully: ${dirpath}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Filesystem MCP server running on stdio");
  }
}

const server = new FilesystemMCPServer();
server.run().catch(console.error);