import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dashboardServer: any = null;
let dashboardPort: number | null = null;

export async function openDashboardTool(args: any) {
  const port = (args.port as number) || 3001;

  try {
    // 이미 서버가 실행 중이면 URL만 반환
    if (dashboardServer && dashboardPort === port) {
      const url = `http://localhost:${port}`;
      openBrowser(url);
      
      return {
        content: [
          {
            type: 'text',
            text: `Dashboard is already running at ${url}\nOpening in browser...`,
          },
        ],
      };
    }

    // 새 서버 시작
    const app = express();
    
    // Serve static files from project root
    const projectRoot = join(__dirname, '..', '..');
    app.use(express.static(projectRoot));

    // API endpoints for dashboard
    setupDashboardAPI(app);

    // Serve dashboard HTML
    app.get('/', (req, res) => {
      res.sendFile(join(projectRoot, 'dashboard.html'));
    });

    // Start server
    await new Promise<void>((resolve, reject) => {
      dashboardServer = app.listen(port, () => {
        dashboardPort = port;
        logger.info(`Dashboard server started on port ${port}`);
        resolve();
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use. Try a different port.`));
        } else {
          reject(error);
        }
      });
    });

    const url = `http://localhost:${port}`;
    openBrowser(url);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Dashboard opened at ${url}\n\nThe dashboard provides:\n- 🔍 Search through guidelines\n- 📚 Browse collections\n- 📊 View collection statistics\n- ⚙️ Configuration details\n\nThe server will keep running until you close Claude or restart the MCP server.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to open dashboard:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error opening dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

function setupDashboardAPI(app: express.Express) {
  const chromaHost = process.env.CHROMA_DB_HOST || 'localhost';
  const chromaPort = process.env.CHROMA_DB_PORT || '8000';

  // Status endpoint
  app.get('/api/status', async (req, res) => {
    const status = {
      chromadb: 'offline',
      collections: 0,
      env: {
        chromaHost,
        chromaPort,
      },
    };

    try {
      const { ChromaClient } = await import('chromadb');
      const client = new ChromaClient({
        path: `http://${chromaHost}:${chromaPort}`,
      });

      const collections = await client.listCollections();
      status.chromadb = 'online';
      status.collections = collections.length;
    } catch (error) {
      logger.debug('ChromaDB connection error:', error);
    }

    res.json(status);
  });

  // Collections endpoint
  app.get('/api/collections', async (req, res) => {
    try {
      const { ChromaClient, DefaultEmbeddingFunction } = await import('chromadb');
      const client = new ChromaClient({
        path: `http://${chromaHost}:${chromaPort}`,
      });

      const allCollections = await client.listCollections();
      let totalDocs = 0;
      const collectionsInfo = [];
      const embedder = new DefaultEmbeddingFunction();

      for (const collectionName of allCollections) {
        try {
          const collection = await client.getCollection({
            name: collectionName,
            embeddingFunction: embedder,
          });

          const count = await collection.count();
          collectionsInfo.push({
            name: collectionName,
            totalDocuments: count,
          });
          totalDocs += count;
        } catch (e) {
          logger.debug(`Collection ${collectionName} error:`, e);
        }
      }

      res.json({
        success: true,
        collections: collectionsInfo,
        totalDocuments: totalDocs,
      });
    } catch (error) {
      logger.error('Collections error:', error);
      res.json({
        success: false,
        error: (error as Error).message,
        collections: [],
      });
    }
  });

  // Collection details endpoint
  app.get('/api/collections/:name', async (req, res) => {
    const collectionName = req.params.name;

    try {
      const { ChromaClient, DefaultEmbeddingFunction } = await import('chromadb');
      const client = new ChromaClient({
        path: `http://${chromaHost}:${chromaPort}`,
      });

      const embedder = new DefaultEmbeddingFunction();
      const collection = await client.getCollection({
        name: collectionName,
        embeddingFunction: embedder,
      });

      const count = await collection.count();
      const peek = await collection.peek({ limit: 10 });

      const documents: any[] = [];
      if (peek.documents) {
        peek.documents.forEach((doc, i) => {
          documents.push({
            id: peek.ids?.[i],
            content: doc,
            metadata: peek.metadatas?.[i] || {},
          });
        });
      }

      res.json({
        success: true,
        collection: {
          name: collectionName,
          totalDocuments: count,
          sampleDocuments: documents,
        },
      });
    } catch (error) {
      logger.error(`Collection ${collectionName} error:`, error);
      res.json({
        success: false,
        error: `Collection '${collectionName}' not found or error accessing it`,
        collection: null,
      });
    }
  });

  // Search endpoint
  app.get('/api/search', async (req, res) => {
    const query = req.query.q as string;

    if (!query) {
      return res.json({ error: 'Query parameter required' });
    }

    try {
      const { ChromaClient, DefaultEmbeddingFunction } = await import('chromadb');
      const client = new ChromaClient({
        path: `http://${chromaHost}:${chromaPort}`,
      });

      const embedder = new DefaultEmbeddingFunction();
      const collection = await client.getCollection({
        name: 'mcp_frontend_default',
        embeddingFunction: embedder,
      });

      const results = await collection.query({
        queryTexts: [query],
        nResults: 5,
      });

      const formattedResults: any[] = [];
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas?.[0]?.[i] || {};
          const distance = results.distances?.[0]?.[i] || 0;

          let similarity;
          if (distance <= 0) {
            similarity = 100;
          } else if (distance >= 2) {
            similarity = 0;
          } else {
            similarity = ((2 - distance) / 2 * 100).toFixed(1);
          }

          const cleanDoc = doc?.replace(/\n\n+/g, ' ').replace(/\s+/g, ' ').trim();

          formattedResults.push({
            content: cleanDoc?.substring(0, 200) + '...',
            metadata: metadata,
            score: similarity,
            distance: distance.toFixed(3),
          });
        });
      }

      res.json({
        success: true,
        results: formattedResults,
        method: 'chromadb-embedding',
        model: 'all-MiniLM-L6-v2',
      });
    } catch (error) {
      logger.error('Search error:', error);
      res.json({
        success: false,
        error: (error as Error).message,
        results: [],
      });
    }
  });
}

function openBrowser(url: string) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${cmd} ${url}`, (error) => {
    if (error) {
      logger.warn(`Could not open browser automatically: ${error.message}`);
    }
  });
}

export function closeDashboard() {
  if (dashboardServer) {
    dashboardServer.close();
    dashboardServer = null;
    dashboardPort = null;
    logger.info('Dashboard server stopped');
  }
}
