import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let isGeminiAvailable = false;

try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    isGeminiAvailable = true;
    console.log('✅ Gemini AI service initialized successfully');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not set. AI features will use fallback methods.');
  }
} catch (error) {
  console.error('❌ Error initializing Gemini AI:', error);
  console.warn('⚠️ AI features will use fallback methods.');
}

class GeminiService {
  constructor() {
    this.chunkEmbeddingsCache = new Map(); // Cache embeddings
    if (isGeminiAvailable && genAI) {
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('✅ Gemini AI model loaded successfully');
    } else {
      this.model = null;
      console.log('⚠️ Using fallback AI methods');
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dot / (normA * normB);
  }

  async getEmbedding(text) {
    if (!this.model || !text) return null;
    if (this.chunkEmbeddingsCache.has(text)) return this.chunkEmbeddingsCache.get(text);
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding;
      this.chunkEmbeddingsCache.set(text, embedding); // Cache embedding
      return embedding;
    } catch (err) {
      console.error('Embedding error:', err);
      return null;
    }
  }

  generateFallbackAnswer(question, documents) {
    const fallbackMsg = "I don't have enough information in the available documents to answer this question.";
    if (!question || !documents || documents.length === 0) return fallbackMsg;

    const questionWords = question.toLowerCase().split(/\W+/).filter(Boolean);
    let bestMatch = null;
    let maxScore = 0;

    documents.forEach(doc => {
      const sentences = doc.content.split(/(?<=[.!?])\s+/);
      sentences.forEach(sentence => {
        let score = questionWords.filter(qw => sentence.toLowerCase().includes(qw)).length;
        console.log(questionWords);
        console.log(score);
        if (score > maxScore){
          maxScore = score;
          bestMatch = { doc, sentence };
        }
      });
    });

    if (!bestMatch || maxScore === 0) return fallbackMsg;
    return `Based on the document "${bestMatch.doc.title}", here's what I found: ${bestMatch.sentence}`;
  }

      /**
       * Generate a summary for a document using Gemini AI or fallback
       * @param {string} content - The document content
       * @returns {Promise<string>} - The summary
       */
      async generateTags(content) {
        if (!content || content.trim().length === 0) return [];
        if (!this.model) {
          // fallback: extract common words as tags
          const words = content.toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 3)
            .filter(word => !['the', 'and', 'that', 'have', 'for', 'not', 'you', 'with', 'this'].includes(word));
          const uniqueWords = [...new Set(words)];
          return uniqueWords.slice(0, 5); // Return top 5 words as tags
        }
        try {
          const prompt = `Extract 3-5 relevant tags from this content. Return only the tags separated by commas:\n\n${content}`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const tags = response.text().split(',').map(tag => tag.trim()).filter(Boolean);
          return tags;
        } catch (error) {
          console.error('Error generating tags:', error);
          return [];
        }
      }

      async generateSummary(content) {
        if (!content || content.trim().length === 0) return '';
        if (!this.model) {
          // fallback: first 2-3 sentences
          const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
          return sentences.slice(0, 3).join(' ');
        }
        try {
          const prompt = `Summarize the following document in 2-3 sentences:\n\n${content}`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const summary = response.text().trim();
          return summary;
        } catch (err) {
          console.error('Gemini summary generation failed, using fallback:', err);
          const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
          return sentences.slice(0, 3).join(' ');
        }
      }
    /**
     * Semantic search: returns relevant documents for a query using embeddings and cosine similarity
     * @param {string} query - The search query
     * @param {Array} documents - Array of document objects
     * @returns {Array} - Array of relevant documents sorted by similarity
     */
    async semanticSearch(query, documents) {
      if (!query || query.trim().length === 0 || !documents || documents.length === 0) return [];
      if (!this.model) {
        // fallback: keyword match in title/content/summary/tags
        const q = query.toLowerCase();
        return documents.filter(doc =>
          doc.title?.toLowerCase().includes(q) ||
          doc.content?.toLowerCase().includes(q) ||
          doc.summary?.toLowerCase().includes(q) ||
          (doc.tags || []).some(tag => tag.toLowerCase().includes(q))
        );
      }

      // Step 1: Get query embedding
      const queryEmbedding = await this.getEmbedding(query);
      if (!queryEmbedding) return [];

      // Step 2: Score each document by similarity
      const scoredDocs = [];
      for (const doc of documents) {
        // Use summary+title+content for embedding
        const text = `${doc.title || ''} ${doc.summary || ''} ${doc.content || ''}`.trim();
        const docEmbedding = await this.getEmbedding(text);
        if (!docEmbedding) continue;
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        // Use a reasonable threshold (0.6)
        if (similarity >= 0.6) scoredDocs.push({ doc, similarity });
      }
      if (scoredDocs.length === 0) return [];
      // Sort by similarity descending
      scoredDocs.sort((a, b) => b.similarity - a.similarity);
      // Return top 10 relevant documents
      return scoredDocs.slice(0, 10).map(d => d.doc);
    }
  async answerQuestion(question, documents) {
    const fallbackMsg = "I don't have enough information in the available documents to answer this question.";

    if (!question || question.trim().length === 0) return 'Please provide a question to answer.';
    if (!documents || documents.length === 0) return 'No documents available to answer your question.';
    if (!this.model) return this.generateFallbackAnswer(question, documents);

    // Step 1: Chunk documents
    const chunks = [];
    documents.forEach(doc => {
      const sentences = doc.content.split(/(?<=[.!?])\s+/);
      for (let i = 0; i < sentences.length; i += 5) {
        const chunkContent = sentences.slice(i, i + 5).join(' ');
        chunks.push({ title: doc.title, content: chunkContent, tags: doc.tags || [] });
      }
    });

    // Step 2: Get question embedding
    const questionEmbedding = await this.getEmbedding(question);
    if (!questionEmbedding) return fallbackMsg;

    // Step 3: Compute similarities
    const relevantChunks = [];
    for (const chunk of chunks) {
      const chunkEmbedding = await this.getEmbedding(chunk.content);
      if (!chunkEmbedding) continue;
      const similarity = this.cosineSimilarity(questionEmbedding, chunkEmbedding);
      const threshold = chunk.content.length > 200 ? 0.75 : 0.6; // dynamic threshold
      if (similarity >= threshold) relevantChunks.push({ ...chunk, similarity });
    }

    if (relevantChunks.length === 0) return this.generateFallbackAnswer(question, documents);

    // Step 4: Sort by similarity & pick top 3
    relevantChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = relevantChunks.slice(0, 3);

    // Step 5: Build prompt
    const qaPrompt = `You are an AI assistant answering questions using ONLY the provided document excerpts.

Question: "${question}"

Excerpts:
${topChunks.map(c => `Document: ${c.title}\nContent: ${c.content}`).join('\n---\n')}

Instructions:
- Answer using only the excerpts.
- Cite the document title if relevant.
- If the answer is not in the excerpts, reply: "${fallbackMsg}".`;

    // Step 6: Call Gemini
    try {
      const answerResult = await this.model.generateContent(qaPrompt);
      const answerResponse = await answerResult.response;
      const answer = answerResponse.text().trim();

      const excerptTexts = topChunks.map(c => c.content.toLowerCase());
      const answerLower = answer.toLowerCase();
      const citesDocument = topChunks.some(c => answerLower.includes(c.title.toLowerCase()));
      const usesExcerpt = excerptTexts.some(ex => answerLower.includes(ex.slice(0, 20)));

      if (!answer || answer.toLowerCase().includes(fallbackMsg.toLowerCase()) || (!citesDocument && !usesExcerpt)) {
        return this.generateFallbackAnswer(question, documents);
      }

      return answer;
    } catch (err) {
      console.error('Gemini Q&A failed, using fallback');
      return this.generateFallbackAnswer(question, documents);
    }
  }
}

export default new GeminiService();
