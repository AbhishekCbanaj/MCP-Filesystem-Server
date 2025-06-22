import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

export class FilesystemMCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Spawn the MCP server process
      const serverProcess = spawn("node", ["src/server.js"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Create transport using the server process
      this.transport = new StdioClientTransport({
        command: "node",
        args: ["src/server.js"],
      });

      // Create and connect client
      this.client = new Client(
        {
          name: "filesystem-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      this.isConnected = true;
      console.log("Connected to MCP server");
      
      return true;
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  async createFile(filepath, content) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "create_file",
          arguments: {
            filepath,
            content,
          },
        },
      },
      {}
    );

    return result;
  }

  async readFile(filepath) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "read_file",
          arguments: {
            filepath,
          },
        },
      },
      {}
    );

    return result;
  }

  async editFile(filepath, content) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "edit_file",
          arguments: {
            filepath,
            content,
          },
        },
      },
      {}
    );

    return result;
  }

  async deleteFile(filepath) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "delete_file",
          arguments: {
            filepath,
          },
        },
      },
      {}
    );

    return result;
  }

  async listFiles(dirpath) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "list_files",
          arguments: {
            dirpath,
          },
        },
      },
      {}
    );

    return result;
  }

  async createDirectory(dirpath) {
    if (!this.isConnected) {
      throw new Error("Client not connected");
    }

    const result = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: "create_directory",
          arguments: {
            dirpath,
          },
        },
      },
      {}
    );

    return result;
  }

  async processPrompt(prompt, workingDirectory = "./workspace") {
    // Simple prompt processing - in a real implementation, you'd use an LLM
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes("create file")) {
      const match = prompt.match(/create file (.+) with content (.+)/i);
      if (match) {
        const filepath = `${workingDirectory}/${match[1]}`;
        const content = match[2];
        return await this.createFile(filepath, content);
      }
    } else if (lowerPrompt.includes("read file")) {
      const match = prompt.match(/read file (.+)/i);
      if (match) {
        const filepath = `${workingDirectory}/${match[1]}`;
        return await this.readFile(filepath);
      }
    } else if (lowerPrompt.includes("edit file")) {
      const match = prompt.match(/edit file (.+) with content (.+)/i);
      if (match) {
        const filepath = `${workingDirectory}/${match[1]}`;
        const content = match[2];
        return await this.editFile(filepath, content);
      }
    } else if (lowerPrompt.includes("delete file")) {
      const match = prompt.match(/delete file (.+)/i);
      if (match) {
        const filepath = `${workingDirectory}/${match[1]}`;
        return await this.deleteFile(filepath);
      }
    } else if (lowerPrompt.includes("list files")) {
      return await this.listFiles(workingDirectory);
    }

    return {
      content: [
        {
          type: "text",
          text: "I didn't understand that command. Try: 'create file filename.txt with content hello world', 'read file filename.txt', 'edit file filename.txt with content new content', 'delete file filename.txt', or 'list files'",
        },
      ],
    };
  }
}