# VoiceLedger V11 (Royal Blue & Safari Safe)

An intelligent expense tracker that converts your voice notes into structured transaction data using Google Gemini 2.5 Flash.

## V11 Updates
- **Safari Crash Fix**: Implemented robust process polyfills and lazy AI initialization to prevent white screen issues on iOS.
- **Debug Mode**: Global error trapping for easier troubleshooting on mobile devices.
- **New Theme**: Royal Blue visuals.

## Features

- 🎙️ **Voice Input**: Record your expenses naturally (e.g., "Spent 25 yuan on breakfast").
- 🤖 **AI Parsing**: Automatically extracts amount, category, date, and description using Gemini 2.5 Flash.
- 📊 **Visualization**: See your spending breakdown in an interactive pie chart.
- 📱 **PWA Ready**: Designed to look and feel like a mobile app.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- @google/genai SDK
- Recharts
- Lucide React

## Setup

Set your `API_KEY` in the environment variables to enable Gemini functionality.