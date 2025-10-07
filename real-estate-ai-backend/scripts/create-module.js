#!/usr/bin/env node

/**
 * Module Scaffolding Tool
 * Creates new modules with standard structure and templates
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ModuleScaffolder {
  constructor() {
    this.templates = {
      basic: this.getBasicTemplate(),
      service: this.getServiceTemplate(),
      api: this.getApiTemplate(),
      full: this.getFullTemplate()
    };
  }

  async createModule(name, type = 'basic', options = {}) {
    const modulePath = path.join(process.cwd(), 'src', 'modules', name);

    console.log(`Creating module '${name}' of type '${type}' at ${modulePath}`);

    // Create module directory
    await fs.mkdir(modulePath, { recursive: true });

    // Get template
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown template type: ${type}`);
    }

    // Create files
    for (const file of template.files) {
      const filePath = path.join(modulePath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      let content = file.content;
      if (file.template) {
        content = this.interpolateTemplate(content, { name, ...options });
      }

      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Created: ${file.path}`);
    }

    // Create package.json
    await this.createPackageJson(modulePath, name, template);

    // Initialize git if requested
    if (options.git) {
      this.initGit(modulePath);
    }

    console.log(`Module '${name}' created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`1. cd ${modulePath}`);
    console.log(`2. npm install`);
    console.log(`3. Implement your module logic`);
    console.log(`4. Register the module in the plugin manager`);
  }

  interpolateTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async createPackageJson(modulePath, name, template) {
    const packageJson = {
      name: `real-estate-ai-${name}`,
      version: '1.0.0',
      description: `Real Estate AI ${name} module`,
      main: 'index.js',
      scripts: {
        test: 'jest',
        build: 'tsc',
        lint: 'eslint src/**/*.ts'
      },
      dependencies: template.dependencies || {},
      devDependencies: {
        '@types/node': '^18.0.0',
        'typescript': '^4.9.0',
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0'
      },
      keywords: ['real-estate-ai', 'module', name],
      author: 'Real Estate AI Team',
      license: 'MIT'
    };

    await fs.writeFile(
      path.join(modulePath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
  }

  initGit(modulePath) {
    try {
      execSync('git init', { cwd: modulePath, stdio: 'inherit' });
      console.log('Git repository initialized');
    } catch (error) {
      console.warn('Failed to initialize git repository:', error.message);
    }
  }

  getBasicTemplate() {
    return {
      name: 'Basic Module',
      description: 'A basic module with minimal structure',
      dependencies: {},
      files: [
        {
          path: 'src/index.ts',
          content: `import { IModule, ModuleHealth } from '../../shared/interfaces';

export class {{name}}Module implements IModule {
  id = '{{name}}';
  name = '{{name}} Module';
  version = '1.0.0';

  async initialize(): Promise<void> {
    console.log('{{name}} module initialized');
    // Add initialization logic here
  }

  async shutdown(): Promise<void> {
    console.log('{{name}} module shutdown');
    // Add cleanup logic here
  }

  async getHealth(): Promise<ModuleHealth> {
    return {
      status: 'healthy',
      timestamp: new Date()
    };
  }
}

export default {{name}}Module;
`,
          template: true
        },
        {
          path: 'src/types.ts',
          content: `// Module-specific types
export interface {{name}}Config {
  enabled: boolean;
  // Add more config options here
}

export interface {{name}}Data {
  // Add data structures here
}
`,
          template: true
        },
        {
          path: 'README.md',
          content: `# {{name}} Module

## Description

Brief description of the {{name}} module functionality.

## Configuration

\`\`\`json
{
  "enabled": true
}
\`\`\`

## Usage

// Add usage examples here
`,
          template: true
        },
        {
          path: '__tests__/index.test.ts',
          content: `import { {{name}}Module } from '../src/index';

describe('{{name}} Module', () => {
  let module: {{name}}Module;

  beforeEach(() => {
    module = new {{name}}Module();
  });

  it('should initialize successfully', async () => {
    await expect(module.initialize()).resolves.toBeUndefined();
  });

  it('should shutdown successfully', async () => {
    await expect(module.shutdown()).resolves.toBeUndefined();
  });

  it('should report healthy status', async () => {
    const health = await module.getHealth();
    expect(health.status).toBe('healthy');
  });
});
`,
          template: true
        }
      ]
    };
  }

  getServiceTemplate() {
    const basic = this.getBasicTemplate();
    return {
      ...basic,
      name: 'Service Module',
      description: 'A module with service layer',
      files: [
        ...basic.files,
        {
          path: 'src/services/{{name}}Service.ts',
          content: `import { Service } from 'typedi';

@Service()
export class {{name}}Service {
  async process(data: any): Promise<any> {
    // Add service logic here
    return data;
  }

  async getStatus(): Promise<string> {
    return 'operational';
  }
}
`,
          template: true
        }
      ]
    };
  }

  getApiTemplate() {
    const service = this.getServiceTemplate();
    return {
      ...service,
      name: 'API Module',
      description: 'A module with API endpoints',
      dependencies: {
        'express': '^4.18.0'
      },
      files: [
        ...service.files,
        {
          path: 'src/controllers/{{name}}Controller.ts',
          content: `import { Request, Response } from 'express';
import { Service } from 'typedi';
import { {{name}}Service } from '../services/{{name}}Service';

@Service()
export class {{name}}Controller {
  constructor(private {{nameLower}}Service: {{name}}Service) {}

  async getData(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.{{nameLower}}Service.process(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async postData(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.{{nameLower}}Service.process(req.body);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
`,
          template: true
        },
        {
          path: 'src/routes/{{name}}Routes.ts',
          content: `import { Router } from 'express';
import { {{name}}Controller } from '../controllers/{{name}}Controller';
import { Service } from 'typedi';

@Service()
export class {{name}}Routes {
  constructor(private controller: {{name}}Controller) {}

  configure(): Router {
    const router = Router();

    router.get('/data', (req, res) => this.controller.getData(req, res));
    router.post('/data', (req, res) => this.controller.postData(req, res));

    return router;
  }
}
`,
          template: true
        }
      ]
    };
  }

  getFullTemplate() {
    const api = this.getApiTemplate();
    return {
      ...api,
      name: 'Full Module',
      description: 'A complete module with all layers',
      dependencies: {
        ...api.dependencies,
        'joi': '^17.0.0',
        'winston': '^3.8.0'
      },
      files: [
        ...api.files,
        {
          path: 'src/middleware/validation.ts',
          content: `import Joi from 'joi';

export const validateData = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};

export const dataSchema = Joi.object({
  // Add validation schema here
});
`,
          template: false
        },
        {
          path: 'src/utils/logger.ts',
          content: `import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '{{name}}-module' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
`,
          template: true
        },
        {
          path: 'src/config/default.ts',
          content: `export default {
  {{nameLower}}: {
    enabled: true,
    // Add default configuration here
  }
};
`,
          template: true
        }
      ]
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: create-module <name> [type] [options]');
    console.log('');
    console.log('Types:');
    console.log('  basic   - Basic module structure');
    console.log('  service - Module with service layer');
    console.log('  api     - Module with API endpoints');
    console.log('  full    - Complete module with all layers');
    console.log('');
    console.log('Options:');
    console.log('  --git   - Initialize git repository');
    process.exit(1);
  }

  const [name, type = 'basic'] = args;
  const options = {
    git: args.includes('--git')
  };

  try {
    const scaffolder = new ModuleScaffolder();
    await scaffolder.createModule(name, type, options);
  } catch (error) {
    console.error('Error creating module:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ModuleScaffolder;