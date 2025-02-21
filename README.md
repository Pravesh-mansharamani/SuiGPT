# SuiGPT - Intelligent Sui Blockchain Assistant

SuiGPT is an AI-powered chatbot specifically designed to help developers and users understand the Sui blockchain platform and Move programming language. It provides real-time, accurate responses to queries about Sui development, smart contracts, and blockchain concepts.

## Features

- 🤖 **Intelligent Responses**: Powered by GPT-4 for accurate and context-aware answers
- 💻 **Code Examples**: Provides clear, executable Move code examples
- 🎨 **Modern UI**: Clean, responsive interface with dark/light mode support
- ⚡ **Real-time**: Instant responses with typewriter effects
- 📚 **Comprehensive Knowledge**: Deep understanding of Sui blockchain and Move language

## Local Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- OpenAI API Key
- Pinecone API Key and Index

### Environment Variables

Create a `.env` file in the root directory with:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
```

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/suigpt.git
cd suigpt
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open your browser and visit:
```
http://localhost:3000
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Langchain
- Pinecone Vector Database
- OpenAI GPT-4

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to add.

## License

MIT License - feel free to use this project for your own learning and development! 