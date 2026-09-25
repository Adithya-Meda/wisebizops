# WiseBizOps - DevOps Tools

Zero-trust architecture DevOps tools and Kubernetes analyzer built with Next.js.

## Features

- **Zero-trust Architecture**: Secure by default, processing sensitive data completely in-memory.
- **PII & Credentials Scrubbing**: Automatically detects and redacts IPv4/v6 addresses, MAC addresses, and credentials (e.g., API keys, Bearer tokens).
- **AI-Powered Insights**: Integrates with Google Gemini to analyze infrastructure and provide actionable feedback.

## Getting Started

### Prerequisites

You will need the following environment variables. Copy the `.env.example` file to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the [MIT License](LICENSE).
