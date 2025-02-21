import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts"; 
import dotenv from 'dotenv';

dotenv.config();

// Custom prompt template that includes handling for no context and source citations
const QA_PROMPT = PromptTemplate.fromTemplate(`You are a helpful AI assistant for the Aptos blockchain platform.
Use the following pieces of context to answer the question at the end. 
If you don't find relevant information in the context, provide a general response based on common knowledge but mention that it's not from the official documentation.
Include relevant source file paths when providing information.

Context: {context}

Question: {question}

Answer (include source citations when available):`);

async function createRAG() {
  // Initialize Pinecone and OpenAI
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
  });

  // Create vector store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  // Initialize ChatOpenAI model
  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0.0,
  });

  // Create the chain with custom prompt
  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model, { prompt: QA_PROMPT }),
    retriever: vectorStore.asRetriever({
      k: 3, // Fetch top 3 most relevant documents
      searchType: "similarity"
    }),
  });

  // Test queries
  const testQueries = [
    "What is a vector in Move?",
    "How do I create a custom processor in the indexer SDK?",
    "What is the purpose of the indexer API?"
  ];

  // Run test queries
  for (const query of testQueries) {
    console.log("\nQuery:", query);
    try {
      const response = await chain.invoke({
        query: query
      });
      console.log("Response:", response);
    } catch (error) {
      console.error("Error processing query:", error);
    }
  }
}

// Run the RAG system
createRAG().catch(console.error); 