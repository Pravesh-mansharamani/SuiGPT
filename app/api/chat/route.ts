import { NextResponse } from 'next/server';
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const requestSchema = z.object({
  message: z.string().min(1),
});

// Custom prompt template
const QA_PROMPT = PromptTemplate.fromTemplate(`
You are a knowledgeable and friendly AI assistant specializing in the Sui blockchain platform. Your mission is to provide clear, concise, and accurate answers about the Sui blockchain and its Move programming language, catering to both developers and newcomers.

Guidelines:
- Clarity and Specificity: Ensure responses are easy to understand and directly address the user's query. Avoid unnecessary jargon and be as specific as possible.
- Contextual Awareness: Utilize any provided context to inform your answers, ensuring relevance and accuracy. If context is insufficient, politely request additional details from the user.
- Role Adoption: Assume the role of an expert in Sui blockchain technology, providing insights and explanations as a subject matter specialist.
- Engagement and Readability: Keep responses engaging and to the point. Use line breaks between sections to enhance readability and flow.
- Politeness: Maintain a courteous and respectful tone in all interactions.

- add /n/n after each section even its sub section except the last one
- use highlighted text and bold text for the key points
- dont add comments in the code block or any where in the code response
- However complex the code is dont add comments in the code block, explain what you doing after that in text

Context: {context}

Question: {question}

Answer (in markdown format):
`);

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