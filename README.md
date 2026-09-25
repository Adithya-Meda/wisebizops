# WiseBizOps - DevOps Tools

Welcome to **WiseBizOps**, a modern, AI-powered suite of DevOps and Cloud Architecture tools built to help engineers analyze, estimate, and optimize their infrastructure. Designed with a strict zero-trust philosophy, this application ensures your sensitive configurations and credentials remain secure and private while delivering cutting-edge AI insights.

### Included Tools
- **Kubernetes (K8s) Analyzer:** Paste your Kubernetes manifests to diagnose and automatically fix configuration errors, resolve security vulnerabilities, and receive actionable DevSecOps fixes for your clusters.
- **AWS Cost Estimator & AI Architect:** Analyze AWS deployment configurations to get intelligent cost estimations and architectural feedback based on the latest AWS pricing structures.

## Features

- **Zero-trust Architecture**: Secure by default, processing sensitive data completely in-memory.
- **PII & Credentials Scrubbing**: Automatically detects and redacts IPv4/v6 addresses, MAC addresses, and credentials (e.g., API keys, Bearer tokens).
- **AI-Powered Insights**: Integrates with advanced AI to analyze infrastructure and provide actionable feedback.

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
