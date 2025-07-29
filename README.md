# AI Chat Application with Real-Time Streaming

A real-time AI chat application built with [Convex](https://convex.dev) and React, featuring ChatGPT-like streaming responses using Convex Components.

This project demonstrates how to build a production-ready chat interface with real-time text streaming, similar to ChatGPT, without dealing with WebSockets or SSE protocols directly.

## Features

- 🚀 Real-time streaming text responses
- 💬 Conversation history management
- 🔐 Authentication with Convex Auth
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔄 Persistent chat sessions
  
## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex (serverless backend platform)
- **Streaming**: `@convex-dev/persistent-text-streaming` component
- **Styling**: Tailwind CSS
- **Authentication**: Convex Auth with anonymous sign-in

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Convex account (sign up at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hyochan/ai-chat.git
cd ai-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

4. In a new terminal, start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
├── src/                  # React frontend
│   ├── components/       # UI components
│   │   ├── MessageList.tsx    # Chat message display with streaming
│   │   ├── ChatInput.tsx      # Message input component
│   │   └── ApiKeyModal.tsx    # API key configuration
│   └── App.tsx          # Main application component
├── convex/              # Backend functions
│   ├── chat.ts          # Chat logic and streaming
│   ├── auth.ts          # Authentication setup
│   ├── schema.ts        # Database schema
│   └── http.ts          # HTTP routes for streaming
└── package.json         # Dependencies and scripts
```

## Key Implementation Details

### Streaming Architecture

The app uses `@convex-dev/persistent-text-streaming` to handle real-time text streaming:

1. **Backend**: When a message is sent, a unique `streamId` is created
2. **Streaming**: The `/chat-stream` HTTP endpoint streams responses character by character
3. **Frontend**: The `useStream` hook subscribes to updates and displays them in real-time

### Core Components

- **StreamingMessage**: Displays messages with real-time streaming animation
- **MessageList**: Manages the chat conversation display
- **ChatInput**: Handles user input and message sending

### Authentication

The app uses [Convex Auth](https://auth.convex.dev/) with anonymous authentication for easy sign-in. You can modify this to add other authentication providers like Google, GitHub, etc.

## Configuration

### API Keys

The app supports two modes:
1. **Built-in AI**: Uses a limited free tier (default)
2. **Custom OpenAI API Key**: Users can provide their own API key for full access

### Environment Variables

Create a `.env.local` file:

```env
VITE_CONVEX_URL=<your-convex-deployment-url>
```

## Deployment

### Deploy to Production

1. Build the app:
```bash
npm run build
```

2. Deploy to Convex:
```bash
npx convex deploy
```

3. Deploy the frontend to your preferred hosting service (Vercel, Netlify, etc.)

### Hosting Options

- **Frontend**: Any static hosting service (Vercel, Netlify, Cloudflare Pages)
- **Backend**: Automatically hosted by Convex

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Components](https://www.convex.dev/components)
- [Persistent Text Streaming Component](https://www.convex.dev/components/persistent-text-streaming)

## License

This project is open source and available under the MIT License.
