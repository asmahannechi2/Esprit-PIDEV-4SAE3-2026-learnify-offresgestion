/**
 * Microservice Node.js (Express + Mongoose) — base MongoDB Atlas.
 * Préfixe API : /api/mongo-events (routé par l’API Gateway).
 */
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const PORT = Number(process.env.PORT) || 8090;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant. Exemple : mongodb+srv://user:pass@cluster.xxx.mongodb.net/nom_db?retryWrites=true&w=majority');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '512kb' }));

const serviceEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true },
    message: { type: String },
    source: { type: String, default: 'integrated-app' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const ServiceEvent = mongoose.model('ServiceEvent', serviceEventSchema);

/** Articles / posts stockés dans MongoDB (admin CRUD via le frontend). */
const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    authorLabel: { type: String, default: '', trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

postSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

const Post = mongoose.model('Post', postSchema);

function invalidId(res) {
  return res.status(400).json({ error: 'Identifiant invalide' });
}

app.get('/api/mongo-events/health', (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.json({
    status: dbOk ? 'UP' : 'DOWN',
    service: 'mongo-event-service',
    runtime: `node ${process.version}`,
    database: dbOk ? 'connected' : 'disconnected',
  });
});

app.get('/api/mongo-events/events', async (_req, res) => {
  try {
    const list = await ServiceEvent.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/mongo-events/events', async (req, res) => {
  try {
    const { eventType, message, source, metadata } = req.body || {};
    if (!eventType) {
      return res.status(400).json({ error: 'eventType requis' });
    }
    const doc = await ServiceEvent.create({ eventType, message, source, metadata });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

/** CRUD posts — préfixe aligné sur la gateway : /api/mongo-events/posts */
app.get('/api/mongo-events/posts', async (_req, res) => {
  try {
    const list = await Post.find().sort({ updatedAt: -1 }).limit(200).lean();
    const mapped = list.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      content: p.content,
      excerpt: p.excerpt,
      status: p.status,
      authorLabel: p.authorLabel,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/mongo-events/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);
    const doc = await Post.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Post introuvable' });
    res.json({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      excerpt: doc.excerpt,
      status: doc.status,
      authorLabel: doc.authorLabel,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/mongo-events/posts', async (req, res) => {
  try {
    const { title, content, excerpt, status, authorLabel } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title requis' });
    }
    const st = status === 'published' || status === 'draft' ? status : 'draft';
    const doc = await Post.create({
      title: String(title).trim(),
      content: content != null ? String(content) : '',
      excerpt: excerpt != null ? String(excerpt) : '',
      status: st,
      authorLabel: authorLabel != null ? String(authorLabel).trim() : '',
    });
    res.status(201).json(doc.toJSON());
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.put('/api/mongo-events/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);
    const { title, content, excerpt, status, authorLabel } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (content !== undefined) update.content = String(content);
    if (excerpt !== undefined) update.excerpt = String(excerpt);
    if (authorLabel !== undefined) update.authorLabel = String(authorLabel).trim();
    if (status !== undefined) {
      if (status !== 'draft' && status !== 'published') {
        return res.status(400).json({ error: 'status doit être draft ou published' });
      }
      update.status = status;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    const doc = await Post.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'Post introuvable' });
    res.json(doc.toJSON());
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/mongo-events/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);
    const r = await Post.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ error: 'Post introuvable' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

async function main() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log('[mongoose] connecté à MongoDB');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[mongo-event-service] écoute sur :${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
