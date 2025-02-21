import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import type { Document } from "langchain/document";
import { encode } from 'gpt-tokenizer';
import * as fs from 'fs';
import { getFilesInfo, loadIgnorePatterns } from './getFileInfo.ts';
import dotenv from 'dotenv';

dotenv.config();

function calculateChunks(tokenCount: number): { targetSize: number; numChunks: number } {
  if (tokenCount <= 500) {
    return { targetSize: tokenCount, numChunks: 1 };
  }
  
  if (tokenCount <= 650) {
    return { targetSize: tokenCount, numChunks: 1 };
  }

  if (tokenCount <= 1500) {
    return { targetSize: Math.ceil(tokenCount / 2), numChunks: 2 };
  }

  if (tokenCount <= 2500) {
    return { targetSize: Math.ceil(tokenCount / 3), numChunks: 3 };
  }

  if (tokenCount <= 4000) {
    return { targetSize: Math.ceil(tokenCount / 4), numChunks: 4 };
  }

  console.warn(`File is very large (${tokenCount} tokens). Splitting into smaller chunks.`);
  const numChunks = Math.ceil(tokenCount / 700);
  return { targetSize: 700, numChunks };
}

async function chunkAndStore() {

  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
  });

  const ignorePatterns = loadIgnorePatterns();
  const filesInfo = getFilesInfo('.', ['.mdx', '.md'], ignorePatterns);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  for (const fileInfo of filesInfo) {
    const content = fs.readFileSync(fileInfo.file_path, 'utf-8');
    const { targetSize, numChunks } = calculateChunks(fileInfo.token_count);
    
    if (numChunks === 1) {
      console.log(`Storing ${fileInfo.file_path} as single chunk (${fileInfo.token_count} tokens)`);
      const doc: Document = {
        pageContent: content,
        metadata: { source: fileInfo.file_path }
      };
      await vectorStore.addDocuments([doc]);
      continue;
    }

    // Multiple chunks needed
    console.log(`Splitting ${fileInfo.file_path} into ${numChunks} chunks (target ${targetSize} tokens per chunk)`);
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: Math.ceil(content.length / numChunks),
      chunkOverlap: Math.ceil((content.length / numChunks) * 0.1),
      lengthFunction: (text: string) => encode(text).length,
    });

    const docs = await splitter.createDocuments(
      [content],
      [{ source: fileInfo.file_path }]
    );

    // Verify and log chunk sizes
    const chunks = docs.map((doc: Document) => ({
      ...doc,
      tokenCount: encode(doc.pageContent).length
    }));

    console.log(`Created ${chunks.length} chunks with token counts:`, 
      chunks.map((c: { tokenCount: number }) => c.tokenCount));

    // Warn if any chunk is too large
    const largeChunks = chunks.filter(c => c.tokenCount > 800);
    if (largeChunks.length > 0) {
      console.warn(`Warning: ${largeChunks.length} chunks are larger than 800 tokens:`,
        largeChunks.map(c => c.tokenCount));
    }

    await vectorStore.addDocuments(docs);
  }
}

chunkAndStore().catch(console.error);