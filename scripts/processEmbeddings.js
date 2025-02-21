import { config } from 'dotenv';
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { encode } from 'gpt-tokenizer';
import { readFileSync } from 'fs';
import { getFilesInfo, loadIgnorePatterns } from './getFileInfo.js';

// Load environment variables
config();

// Validate environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_INDEX'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

function calculateChunks(tokenCount) {
  if (tokenCount <= 500) return { targetSize: tokenCount, numChunks: 1 };
  if (tokenCount <= 650) return { targetSize: tokenCount, numChunks: 1 };
  if (tokenCount <= 1500) return { targetSize: Math.ceil(tokenCount / 2), numChunks: 2 };
  if (tokenCount <= 2500) return { targetSize: Math.ceil(tokenCount / 3), numChunks: 3 };
  if (tokenCount <= 4000) return { targetSize: Math.ceil(tokenCount / 4), numChunks: 4 };

  console.warn(`⚠️ File is very large (${tokenCount} tokens). Splitting into smaller chunks.`);
  const numChunks = Math.ceil(tokenCount / 700);
  return { targetSize: 700, numChunks };
}

async function processEmbeddings() {
  try {
    console.log('🔄 Initializing Pinecone...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
    
    console.log('🔄 Setting up OpenAI embeddings...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });

    console.log('🔄 Creating vector store...');
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });

    console.log('✅ Vector store ready!');
    
    const ignorePatterns = loadIgnorePatterns();
    console.log('📁 Scanning for markdown files...');
    const filesInfo = getFilesInfo('.', ['.mdx', '.md'], ignorePatterns);

    if (filesInfo.length === 0) {
      console.log('⚠️ No markdown files found to process');
      return;
    }

    console.log(`📝 Found ${filesInfo.length} files to process`);
    let successCount = 0;
    let errorCount = 0;

    for (const fileInfo of filesInfo) {
      try {
        const { file_path, token_count } = fileInfo;
        const content = readFileSync(file_path, 'utf-8');
        const { targetSize, numChunks } = calculateChunks(token_count);
        
        if (numChunks === 1) {
          console.log(`📄 Processing ${file_path} as single chunk (${token_count} tokens)`);
          await vectorStore.addDocuments([{
            pageContent: content,
            metadata: { source: file_path }
          }]);
          successCount++;
          console.log(`✅ Successfully processed ${file_path}`);
          continue;
        }

        console.log(`📄 Splitting ${file_path} into ${numChunks} chunks (target ${targetSize} tokens per chunk)`);
        
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: Math.ceil(content.length / numChunks),
          chunkOverlap: Math.ceil((content.length / numChunks) * 0.1),
          lengthFunction: (text) => encode(text).length,
        });

        const docs = await splitter.createDocuments(
          [content],
          [{ source: file_path }]
        );

        const chunks = docs.map(doc => ({
          ...doc,
          tokenCount: encode(doc.pageContent).length
        }));

        console.log(`✓ Created ${chunks.length} chunks with token counts:`, 
          chunks.map(c => c.tokenCount));

        const largeChunks = chunks.filter(c => c.tokenCount > 800);
        if (largeChunks.length > 0) {
          console.warn(`⚠️ Warning: ${largeChunks.length} chunks are larger than 800 tokens:`,
            largeChunks.map(c => c.tokenCount));
        }

        await vectorStore.addDocuments(docs);
        successCount++;
        console.log(`✅ Successfully processed ${file_path}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing file ${fileInfo.file_path}:`, error);
      }
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`✅ Successfully processed: ${successCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Failed to process: ${errorCount} files`);
    }
    console.log('🎉 Processing complete!');
  } catch (error) {
    console.error('❌ Error during embeddings processing:', error);
    process.exit(1);
  }
}

// Run the processor
console.log('🚀 Starting embeddings processor...');
processEmbeddings()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 