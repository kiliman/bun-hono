#!/usr/bin/env bun

/**
 * RPC Code Generator
 *
 * Generates:
 * 1. Client stubs (client.ts) - Type-safe client functions
 * 2. RPC adapters (rpc.ts) - Convert params objects to positional args
 * 3. Zod schemas (schemas.ts) - Validation schemas
 * 4. Service registry - Auto-update dispatcher with all services
 *
 * Usage:
 *   bun run src/scripts/generate-rpc.ts
 *   bun run src/scripts/generate-rpc.ts FacetEnvVars
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { Node, Project, type SourceFile, type TypeNode } from "ts-morph";
import { generate } from "ts-to-zod";

const SERVICES_DIR = "src/services";

interface ParamInfo {
  name: string;
  typeNode: TypeNode;
  typeName: string;
  referencedTypes: string[];
  isOptional: boolean;
}

interface ServiceFunction {
  name: string;
  params: ParamInfo[];
  returnTypeNode?: TypeNode;
  returnTypeName: string;
  referencedReturnTypes: string[];
  isAsync: boolean;
}

type ImportsInfo = Record<string, ImportInfo>;
interface ImportInfo {
  name: string;
  isType: boolean;
  path: string;
}

/**
 * Update the RPC dispatcher to include all services
 */
/**
 * Generate rpc-services.generated.ts - exports all service RPC adapters
 */
function generateServicesFile(serviceNames: string[]): void {
  const importString = serviceNames
    .map((name) => `import * as ${name} from "@/services/${name}/rpc";`)
    .join("\n");

  const serviceEntries = serviceNames
    .toSorted()
    .map((name) => `${name},`)
    .join("\n");

  const content = `/**
 * RPC Dispatch lookup
 *
 * This lookup table is used by rcp-dispatcher to map service name to service module
 *
 * Generated file - do not edit manually
 */
${importString}

export const services = {
${serviceEntries}
} as const;
`;

  const servicesPath = join("src/api", "rpc-services.generated.ts");
  Bun.write(servicesPath, content);
  console.log(
    `✅ Generated rpc-services.generated.ts with ${serviceNames.length} services`,
  );
}

class ServiceFileGenerator {
  readonly serviceName: string;
  readonly servicePath: string;
  private sourceFile: SourceFile;
  private functions: ServiceFunction[] = [];
  private imports: ImportsInfo = {};
  private usedImports: Map<string, Set<string>> = new Map();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.servicePath = join(SERVICES_DIR, serviceName);

    const indexPath = join(this.servicePath, "index.ts");

    if (!existsSync(indexPath)) {
      throw new Error(`❌ Service not found: ${serviceName}`);
    }
    // Parse service file
    const project = new Project();
    this.sourceFile = project.addSourceFileAtPath(indexPath);
  }

  parse() {
    // extract all imports from sourcefile and return array
    // { name, isType, path }
    const fromRegex = /from\s+["'](?<path>.+?)["']/m;
    this.imports = this.sourceFile
      .getImportDeclarations()
      .flatMap((importDecl) => {
        let filePath = importDecl
          .getModuleSpecifierSourceFile()
          ?.getFilePath()
          .toString();
        if (!filePath) {
          // extract import from path
          const match = fromRegex.exec(importDecl.getText());
          if (match?.groups) {
            filePath = match.groups.path;
          }
        }
        return importDecl.getNamedImports().map(
          (importSpec) =>
            ({
              name: importSpec.getName(),
              isType: importDecl.isTypeOnly() || importSpec.isTypeOnly(),
              path: filePath,
            }) as ImportInfo,
        );
      })
      .reduce((acc, curr) => {
        // biome-ignore lint/performance/noAccumulatingSpread: ignore
        return { ...acc, [curr.name]: curr };
      }, {});

    // get type definitions for external types
    Object.values(this.imports).filter((i) => i.isType && i.path);

    // Get any exported interfaces/types to generate as imports
    const exports = [
      ...this.sourceFile.getInterfaces(),
      ...this.sourceFile.getTypeAliases(),
    ];
    const exportedTypes = exports.filter((i) => i.isExported());
    for (const alias of exportedTypes) {
      this.imports[alias.getName()] = {
        name: alias.getName(),
        isType: true,
        path: this.sourceFile.getFilePath(),
      };
    }

    const exportedFunctions = this.sourceFile
      .getFunctions()
      .filter((fn) => fn.isExported());

    for (const fn of exportedFunctions) {
      const name = fn.getName();
      if (!name) continue;

      const params = fn.getParameters().map(
        (param) =>
          ({
            name: param.getName(),
            typeNode: param.getTypeNode(),
            typeName: param.getTypeNode()?.getText(),
            referencedTypes: this.extractTypeNames(
              param.getTypeNode()?.getText(),
            ),
            isOptional: param.isOptional(),
          }) as ParamInfo,
      );

      const isAsync = fn.isAsync();
      const serviceFunction: ServiceFunction = {
        name,
        params,
        returnTypeNode: fn.getReturnTypeNode(),
        returnTypeName: fn.getReturnTypeNode()?.getText() ?? "void",
        referencedReturnTypes: this.extractTypeNames(
          fn.getReturnTypeNode()?.getText(),
        ),
        isAsync,
      };
      this.functions.push(serviceFunction);
    }

    // Collect all unique types used in params and return types
    for (const fn of this.functions) {
      for (const param of fn.params) {
        this.addUsedImports(param.referencedTypes);
      }
      this.addUsedImports(fn.referencedReturnTypes);
    }
  }

  generateClient(): string {
    const importDecls = this.generateImportDecls();
    const importString = `/**
 * Client wrappers for ${this.serviceName} service
 *
 * These wrappers convert the function params into a command object to
 * call the RPC endpoint
 *
 * Generated file - do not edit manually
 */

import { callRpc } from "@/lib/rpc-client";
${Array.from(importDecls).join("\n")}
`;

    const functionStubs = this.functions
      .map((fn) => {
        // Build params object (map param names to their values, not types)
        const paramsObj =
          fn.params.length > 0
            ? `{ ${fn.params.map((p) => p.name).join(", ")} }`
            : "{}";

        // Build function signature
        const paramsList =
          fn.params.length > 0
            ? fn.params.map((p) => `${p.name}: ${p.typeName}`).join(", ")
            : "";

        return `
export async function ${fn.name}(${paramsList}): ${this.wrapWithPromise(fn.returnTypeName)} {
  return callRpc({
    method: "${this.serviceName}.${fn.name}",
    params: ${paramsObj},
  });
}`;
      })
      .join("\n");

    return `${importString + functionStubs}\n`;
  }

  generateRpcAdapter(): string {
    const importDecls = this.generateImportDecls();

    const importString = `/**
 * RPC Adapters for ${this.serviceName} service
 *
 * These wrappers convert params objects to positional arguments
 * for the core service functions
 *
 * Generated file - do not edit manually
 */

import * as ${this.serviceName} from "./index";
import * as Schemas from "./schemas";
${Array.from(importDecls).join("\n")}
`;

    const adapters = this.functions
      .map((fn) => {
        // Build params interface
        const paramsInterface =
          fn.params.length > 0
            ? `params: {
${fn.params.map((p) => `    ${p.name}${p.isOptional ? "?" : ""}: ${p.typeName}`).join(";\n")}
  }`
            : "";

        // Build function call with positional args
        const args = fn.params.map((p) => `params.${p.name}`).join(", ");
        const returnType = fn.returnTypeName ?? "void";
        const validate =
          fn.params.length > 0 ? `Schemas.${fn.name}Schema.parse(params);` : "";

        return `
export function ${fn.name}(${paramsInterface}) : ${returnType} {
  ${validate}
  ${returnType !== "void" ? "return" : ""} ${this.serviceName}.${fn.name}(${args});
}`;
      })
      .join("\n");

    return `${importString + adapters}\n`;
  }

  generateSchemas(): string {
    const importString = `/**
 * Zod schemas for ${this.serviceName} service
 *
 * These schemas will be used to validate incoming RPC requests
 *
 * Generated file - do not edit manually
 */

import { z } from "zod";
`;
    const usedSchemas = new Set<string>();
    const schemas = this.functions
      .map((fn) => {
        if (fn.params.length === 0) {
          return "";
        }

        const fields = fn.params
          .map((param) => {
            let zodType = this.typeToZod(param.typeNode);
            usedSchemas.add(param.typeName);
            if (param.isOptional) {
              zodType += ".optional()";
            }
            return `  ${param.name}: ${zodType}`;
          })
          .join(",\n");

        return `export const ${fn.name}Schema = z.object({
${fields}
});`;
      })
      .join("\n\n");

    const distinctImportPaths = Array.from(
      new Set(
        Object.values(this.imports)
          .filter((i) => i.isType && i.path && usedSchemas.has(i.name))
          .map((i) => i.path),
      ),
    );

    const importSchemas = distinctImportPaths.map((importPath) => {
      let filePath = importPath.startsWith("@/")
        ? resolve(import.meta.dir, importPath.replace("@/", "../"))
        : importPath;
      filePath = filePath.endsWith(".ts") ? filePath : `${filePath}.ts`;
      let zsf = generate({
        sourceText: readFileSync(filePath, "utf-8"),
        getSchemaName: (identifer) => `${identifer}Schema`,
      }).getZodSchemasFile(filePath);
      // strip preamble
      zsf = zsf.replace(
        '// Generated by ts-to-zod\nimport { z } from "zod";',
        `// Generated by ts-to-zod from ${relative(this.servicePath, filePath)}`,
      );
      return zsf;
    });

    return `${importString}\n${importSchemas.join("\n")}\n// function parameter schemas\n\n${schemas}\n`;
  }

  /**
   * Convert TypeScript type to Zod schema
   */
  private typeToZod(typeNode?: TypeNode): string {
    if (!typeNode) return "";
    const typeName = typeNode.getText();

    // Basic types
    if (typeName === "string") return "z.string()";
    if (typeName === "number") return "z.number()";
    if (typeName === "boolean") return "z.boolean()";
    if (typeName === "any") return "z.any()";
    if (typeName === "unknown") return "z.unknown()";

    // Array types
    if (Node.isArrayTypeNode(typeNode)) {
      return `z.array(${this.typeToZod(typeNode.getElementTypeNode())})`;
    }

    // assume zod schema already generated for interface/type by ts-to-zod
    return `${typeName}Schema`;
  }

  private addUsedImports(types: string[]) {
    for (const type of types) {
      this.addUsedImport(type);
    }
  }
  private addUsedImport(type: string) {
    const importInfo = this.imports[type];
    if (!importInfo) return;

    let types = this.usedImports.get(importInfo.path);
    if (!types) {
      types = new Set<string>();
      this.usedImports.set(importInfo.path, types);
    }
    types.add(importInfo.name);
  }

  private getImportPath(path: string) {
    if (path.startsWith("@")) return path;
    return `./${relative(this.servicePath, path)}`;
  }

  private wrapWithPromise(type?: string) {
    if (type?.startsWith("Promise")) return type ?? "void";
    return `Promise<${type ?? "void"}>`;
  }

  private extractTypeNames(type?: string) {
    if (!type) return [];
    const typeNames = Array.from(
      new Set(
        type
          .split(/[^A-Za-z0-9]+/g)
          .map((t) => t.trim())
          .filter((t) => !t.match(/^(Array|Promise|Record)$/))
          .filter((t) => t.length > 0), // strip empty strings
      ),
    );
    return typeNames;
  }
  private generateImportDecls() {
    return this.usedImports
      .keys()
      .filter((location) => location)
      .map((location) =>
        String(
          `import type { ${Array.from(this.usedImports.get(location) ?? [])
            .toSorted()
            .join(", ")} } from "${this.getImportPath(location)}"`,
        ),
      );
  }
}

/**
 * Generate all files for a service
 */
function generateService(serviceName: string): void {
  const servicePath = join(SERVICES_DIR, serviceName);
  const indexPath = join(servicePath, "index.ts");

  if (!existsSync(indexPath)) {
    console.error(`❌ Service not found: ${serviceName}`);
    return;
  }

  console.log(`🔨 Generating RPC code for ${serviceName}...`);

  const generator = new ServiceFileGenerator(serviceName);
  generator.parse();

  const clientCode = generator.generateClient();
  const clientPath = join(servicePath, "client.ts");
  Bun.write(clientPath, clientCode);
  console.log(`   ✅ Generated client.ts`);

  const rpcCode = generator.generateRpcAdapter();
  const rpcPath = join(servicePath, "rpc.ts");
  Bun.write(rpcPath, rpcCode);
  console.log(`   ✅ Generated rpc.ts`);

  const schemasCode = generator.generateSchemas();
  const schemasPath = join(servicePath, "schemas.ts");
  Bun.write(schemasPath, schemasCode);
  console.log(`   ✅ Generated schemas.ts`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Generate specific service
    const serviceName = args[0];
    if (!serviceName) return;

    generateService(serviceName);
    console.log(`\n🧹 Formatting files...`);
    await Bun.$`bun check`;
  } else {
    // Generate all services
    const services = readdirSync(SERVICES_DIR).filter((name) => {
      const path = join(SERVICES_DIR, name);
      return existsSync(join(path, "index.ts"));
    });

    console.log(`🚀 Generating RPC code for ${services.length} services...\n`);

    for (const serviceName of services) {
      generateService(serviceName);
    }

    console.log(`\n📦 Generating services file...`);
    generateServicesFile(services);

    console.log(`\n🧹 Formatting files...`);
    await Bun.$`bun check`;

    console.log(`\n✨ Done! Generated code for ${services.length} services.`);
  }
}

main().catch(console.error);
