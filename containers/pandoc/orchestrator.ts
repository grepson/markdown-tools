#!/usr/bin/env node

import chokidar from 'chokidar';
import { glob } from 'glob';
import { minimatch } from 'minimatch';
import fs from 'fs-extra';
import path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';

interface OutputConfig {
  format: string;
  suffix?: string;
  template?: string;
  pandocOptions?: string[];
}

interface Rule {
  name: string;
  glob?: string;
  pattern?: string;
  outputs: OutputConfig[];
  pandocOptions?: string[];
}

interface Config {
  rules: Rule[];
}

interface WorkerData {
  inputPath: string;
  rule: Rule;
  watchDir: string;
  outputDir: string;
  templatesDir: string;
}

interface ConversionResult {
  success: boolean;
  message?: string;
  error?: string;
}

class PandocOrchestrator {
  private config: Config;
  private watchDir: string;
  private outputDir: string;
  private templatesDir: string;
  private maxWorkers: number;
  private activeWorkers: Set<Worker>;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    this.watchDir = process.env.WATCH_DIR || '/app/watch';
    this.outputDir = process.env.OUTPUT_DIR || '/app/output';
    this.templatesDir = process.env.TEMPLATES_DIR || '/app/templates';
    this.maxWorkers = parseInt(process.env.MAX_WORKERS || '3');
    this.activeWorkers = new Set();

    console.log(`🔍 Watching directory: ${this.watchDir}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`📋 Templates directory: ${this.templatesDir}`);
    console.log(`⚡ Max workers: ${this.maxWorkers}`);
  }

  private loadConfig(configPath: string): Config {
    try {
      const config = fs.readJsonSync(configPath) as Config;
      console.log('📝 Loaded configuration with', config.rules.length, 'rules');
      return config;
    } catch (error) {
      console.error('❌ Error loading config:', (error as Error).message);
      return { rules: [] };
    }
  }

  private async convertFileWithWorker(inputPath: string, rule: Rule): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          inputPath,
          rule,
          watchDir: this.watchDir,
          outputDir: this.outputDir,
          templatesDir: this.templatesDir
        } as WorkerData
      });

      this.activeWorkers.add(worker);

      worker.on('message', (result: ConversionResult) => {
        this.activeWorkers.delete(worker);
        if (result.success) {
          console.log(`✅ ${result.message}`);
          resolve(result);
        } else {
          console.error(`❌ ${result.error}`);
          reject(new Error(result.error || 'Unknown error'));
        }
      });

      worker.on('error', (error: Error) => {
        this.activeWorkers.delete(worker);
        console.error(`❌ Worker error: ${error.message}`);
        reject(error);
      });

      worker.on('exit', (code: number) => {
        this.activeWorkers.delete(worker);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  private async convertFile(inputPath: string, rule: Rule): Promise<void> {
    const relativePath = path.relative(this.watchDir, inputPath);
    console.log(`🔄 Queuing: ${relativePath} with rule: ${rule.name}`);

    // Wait if we have too many active workers
    while (this.activeWorkers.size >= this.maxWorkers) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await this.convertFileWithWorker(inputPath, rule);
    } catch (error) {
      console.error(`❌ Error converting ${inputPath}:`, (error as Error).message);
    }
  }

  private generateOutputFileName(inputPath: string, format: string, suffix = ''): string {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const extension = this.getExtensionForFormat(format);
    return `${basename}${suffix}.${extension}`;
  }

  private getExtensionForFormat(format: string): string {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'docx': 'docx',
      'html': 'html',
      'epub': 'epub',
      'latex': 'tex',
      'beamer': 'pdf',
      'revealjs': 'html',
      'pptx': 'pptx',
      'odt': 'odt',
      'rtf': 'rtf'
    };
    return extensions[format] || format;
  }

  private findMatchingRule(filePath: string): Rule | null {
    const relativePath = path.relative(this.watchDir, filePath);

    for (const rule of this.config.rules) {
      if (rule.glob && minimatch(relativePath, rule.glob)) {
        return rule;
      }

      if (rule.pattern && minimatch(path.basename(filePath), rule.pattern)) {
        return rule;
      }
    }

    return null;
  }

  private async scanAndConvert(): Promise<void> {
    console.log('🔍 Scanning existing files...');

    if (!fs.existsSync(this.watchDir)) {
      console.log(`⚠️  Watch directory doesn't exist: ${this.watchDir}`);
      return;
    }

    let totalFiles = 0;

    for (const rule of this.config.rules) {
      const pattern = rule.glob || rule.pattern;
      if (!pattern) {
        console.warn(`⚠️  Rule "${rule.name}" has no pattern or glob defined`);
        continue;
      }

      try {
        let searchPattern: string;
        if (rule.glob) {
          searchPattern = path.join(this.watchDir, rule.glob);
        } else {
          searchPattern = path.join(this.watchDir, '**', pattern);
        }

        const files = await glob(searchPattern, { nodir: true });
        console.log(`📁 Found ${files.length} files matching pattern: ${pattern}`);
        totalFiles += files.length;

        // Process files in parallel batches
        const promises = files
          .filter(file => path.extname(file) === '.md')
          .map(file => this.convertFile(file, rule));

        await Promise.allSettled(promises);
      } catch (error) {
        console.error(`❌ Error scanning pattern "${pattern}":`, (error as Error).message);
      }
    }

    console.log(`✅ Initial scan complete. Processed ${totalFiles} total files.`);
  }

  public start(): void {
    console.log('🚀 Starting Pandoc Orchestrator...');

    // Verify directories exist
    this.verifyDirectories();

    // Initial scan and conversion
    this.scanAndConvert();

    // Watch for file changes
    const watcher = chokidar.watch(this.watchDir, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/,
        /\.git/,
        `${this.outputDir}/**` // don't watch output directory
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', (filePath: string) => {
        if (path.extname(filePath) === '.md') {
          const rule = this.findMatchingRule(filePath);
          if (rule) {
            console.log(`➕ File added: ${path.relative(this.watchDir, filePath)}`);
            this.convertFile(filePath, rule);
          }
        }
      })
      .on('change', (filePath: string) => {
        if (path.extname(filePath) === '.md') {
          const rule = this.findMatchingRule(filePath);
          if (rule) {
            console.log(`🔄 File changed: ${path.relative(this.watchDir, filePath)}`);
            this.convertFile(filePath, rule);
          }
        }
      })
      .on('unlink', (filePath: string) => {
        if (path.extname(filePath) === '.md') {
          console.log(`➖ File removed: ${path.relative(this.watchDir, filePath)}`);
        }
      })
      .on('error', (error: Error) => {
        console.error('❌ Watcher error:', error);
      })
      .on('ready', () => {
        console.log('👀 File watcher ready. Monitoring for changes...');
      });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down orchestrator...');

      // Wait for active workers to finish
      const activeCount = this.activeWorkers.size;
      if (activeCount > 0) {
        console.log(`⏳ Waiting for ${activeCount} active workers to finish...`);
        while (this.activeWorkers.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      watcher.close();
      process.exit(0);
    });
  }

  private verifyDirectories(): void {
    const dirs = [
      { path: this.watchDir, name: 'Watch' },
      { path: this.outputDir, name: 'Output' },
      { path: this.templatesDir, name: 'Templates' }
    ];

    dirs.forEach(dir => {
      try {
        fs.ensureDirSync(dir.path);
        console.log(`✅ ${dir.name} directory ready: ${dir.path}`);
      } catch (error) {
        console.error(`❌ Error with ${dir.name} directory: ${(error as Error).message}`);
      }
    });
  }
}

// Worker thread code
if (!isMainThread) {
  const { inputPath, rule, watchDir, outputDir, templatesDir } = workerData as WorkerData;

  const convertInWorker = async (): Promise<void> => {
    try {
      const relativePath = path.relative(watchDir, inputPath);

      for (const output of rule.outputs) {
        const outputFileName = generateOutputFileName(inputPath, output.format, output.suffix);
        const outputPath = path.join(outputDir, path.dirname(relativePath), outputFileName);

        await fs.ensureDir(path.dirname(outputPath));

        // Build pandoc arguments
        const pandocArgs = await buildPandocArgs(
          inputPath,
          outputPath,
          output,
          rule,
          templatesDir
        );

        // Log the command being executed
        console.log(`🔧 Executing pandoc command: pandoc ${pandocArgs.join(' ')}`);
        console.log(`📂 Input file: ${inputPath}`);
        console.log(`📄 Output file: ${outputPath}`);
        console.log(`📋 Template: ${output.template || 'none'}`);

        // Execute pandoc using spawn
        await executePandoc(pandocArgs, outputPath);

        parentPort?.postMessage({
          success: true,
          message: `Generated: ${path.relative(outputDir, outputPath)}`
        } as ConversionResult);
      }
    } catch (error) {
      parentPort?.postMessage({
        success: false,
        error: `Error in worker: ${(error as Error).message}`
      } as ConversionResult);
    }
  };

  const executePandoc = (args: string[], outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting pandoc process for: ${path.basename(outputPath)}`);

      const pandocProcess = spawn('pandoc', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Ensure proper font configuration
          FONTCONFIG_PATH: '/etc/fonts',
          FC_CACHE_DIR: '/tmp/.fontconfig'
        }
      });

      let stdout = '';
      let stderr = '';

      pandocProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pandocProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pandocProcess.on('close', (code: number) => {
        console.log(`📊 Pandoc process finished with exit code: ${code}`);

        if (stdout) console.log(`📤 STDOUT: ${stdout}`);
        if (stderr) console.log(`📤 STDERR: ${stderr}`);

        if (code === 0) {
          console.log(`✅ Successfully generated: ${path.basename(outputPath)}`);
          resolve();
        } else {
          const errorMessage = stderr || stdout || 'Unknown pandoc error';
          reject(new Error(`Pandoc failed with exit code ${code}: ${errorMessage.trim()}`));
        }
      });

      pandocProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to start pandoc process: ${error.message}`));
      });
    });
  };

  const generateOutputFileName = (inputPath: string, format: string, suffix = ''): string => {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const extension = getExtensionForFormat(format);
    return `${basename}${suffix}.${extension}`;
  };

  const getExtensionForFormat = (format: string): string => {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'docx': 'docx',
      'html': 'html',
      'epub': 'epub',
      'latex': 'tex',
      'beamer': 'pdf',
      'revealjs': 'html',
      'pptx': 'pptx',
      'odt': 'odt',
      'rtf': 'rtf'
    };
    return extensions[format] || format;
  };

  const buildPandocArgs = async (
    inputPath: string,
    outputPath: string,
    output: OutputConfig,
    rule: Rule,
    templatesDir: string
  ): Promise<string[]> => {
    console.log(`🔍 Building pandoc args:`);
    console.log(`   Input path: ${inputPath}`);
    console.log(`   Output path: ${outputPath}`);
    console.log(`   Format: ${output.format}`);

    const pandocArgs = [
      inputPath,
      '-o', outputPath,
      '-f', 'markdown'
    ];

    // Add format-specific arguments
    if (output.format) {
      pandocArgs.push('-t', output.format);
    }

    // Add template if specified
    if (output.template) {
      console.log(`📋 Using template: ${output.template}`);

      // Check if template exists in the templates directory
      const templatePath = path.join(templatesDir, output.template);
      console.log(`📋 Template absolute path: ${templatePath}`);
      console.log(`📋 Template exists: ${await fs.pathExists(templatePath)}`);

      if (await fs.pathExists(templatePath)) {
        pandocArgs.push('--template', templatePath);
      } else {
        console.warn(`⚠️  Template not found: ${templatePath}`);
      }
    }

    // Add custom pandoc options
    if (output.pandocOptions) {
      console.log(`⚙️  Adding output pandoc options: ${output.pandocOptions.join(' ')}`);
      pandocArgs.push(...output.pandocOptions);
    }

    // Add global pandoc options from rule
    if (rule.pandocOptions) {
      console.log(`⚙️  Adding rule pandoc options: ${rule.pandocOptions.join(' ')}`);
      pandocArgs.push(...rule.pandocOptions);
    }

    // Default options for better output
    const defaultOptions = ['--standalone'];

    // Add PDF-specific options
    if (output.format === 'pdf' || output.format === 'beamer') {
      defaultOptions.push('--pdf-engine=xelatex');

      defaultOptions.push('-V', 'mainfont=DejaVu Serif');
      defaultOptions.push('-V', 'sansfont=DejaVu Sans');
      defaultOptions.push('-V', 'monofont=DejaVu Sans Mono');
      defaultOptions.push('-V', 'emoji=Noto Color Emoji');

      // Replace bold emojis fix:
      defaultOptions.push('--lua-filter=filters/strip-bold-emoji.lua');
    }

    // Add HTML-specific options
    if (output.format === 'html' || output.format === 'revealjs') {
      defaultOptions.push('--mathjax');
      defaultOptions.push('--highlight-style=espresso');
    }

    // Add DOCX-specific options
    if (output.format === 'docx') {
      defaultOptions.push('--reference-doc=/usr/share/pandoc/data/reference.docx');
    }

    pandocArgs.push(...defaultOptions);

    console.log(`🎯 Final pandoc command: pandoc ${pandocArgs.join(' ')}`);

    return pandocArgs;
  };

  convertInWorker();
}

// Start the orchestrator if this is the main thread
if (isMainThread) {
  const configFile = process.env.CONFIG_FILE || '/app/config.json';
  const orchestrator = new PandocOrchestrator(configFile);
  orchestrator.start();
}
