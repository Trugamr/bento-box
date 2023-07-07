import { ConnInfo, serve } from "https://deno.land/std@0.193.0/http/server.ts";

// Read scripts from disk
const scripts: Map<
  string,
  {
    handler: (
      request: Request,
      connInfo: ConnInfo,
    ) => Response | Promise<Response>;
  }
> = new Map();

for (const script of Deno.readDirSync("scripts")) {
  // Only read files
  if (!script.isFile) {
    continue;
  }

  // Import the script
  const { handler } = await import(`./scripts/${script.name}`);
  if (typeof handler !== "function") {
    console.error(`No handler function found in ${script.name}`);
    Deno.exit(1);
  }

  scripts.set(`/${script.name.replace(/\.ts$/, "")}`, { handler });
}

// Check if any scripts were found
if (!scripts.size) {
  console.error("No scripts found in scripts/ directory");
  Deno.exit(1);
}

// Create a server
const handler = (request: Request, connInfo: ConnInfo) => {
  const url = new URL(request.url);

  const script = scripts.get(url.pathname);
  if (script) {
    return script.handler(request, connInfo);
  }

  return new Response(`No handler found for ${url.pathname}`, {
    status: 404,
    statusText: "Not Found",
  });
};

await serve(handler, { port: 8080 });
