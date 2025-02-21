import { NextResponse } from 'next/server';
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const requestSchema = z.object({
  message: z.string().min(1),
});

// Custom prompt template
const QA_PROMPT = PromptTemplate.fromTemplate(`You are a highly knowledgeable and friendly AI assistant for the Aptos blockchain platform.
Your goal is to provide clear, helpful, and easy-to-understand answers about Aptos blockchain and the Aptos Move programming language, catering to both developers and those unfamiliar with the platform.

Guidelines:
If asked about Aptos blockchain, provide a general response based on widely known information.
If you don’t have enough information, acknowledge it and ask the user for more details or keywords instead of speculating.
Never mention "context" or "information provided" in your responses.
Keep answers engaging, concise, and to the point. Use \n between sections to make responses more readable and natural.
Format:

Context: {context}

Question: {question}

Answer:`);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = requestSchema.parse(body);

    // Initialize Pinecone with API key and environment
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });

    // Create vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });

    // Initialize ChatOpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4-turbo-preview",
      temperature: 0.3,
    });

    // Create the chain with custom prompt
    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model, { prompt: QA_PROMPT }),
      retriever: vectorStore.asRetriever({
        k: 2, // Fetch top 2 most relevant documents
        searchType: "similarity"
      }),
    });

    // Get response
    const response = await chain.invoke({
      query: message
    });

    return NextResponse.json({ response: response.text });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}