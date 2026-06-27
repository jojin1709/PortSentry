# <img src="icon.png" width="38" height="38" align="center" alt="PortSentry logo" /> PortSentry

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/jojin1709)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/jojin-john/)

A sleek, robust, and modern desktop port monitoring application built with **Electron** and **Node.js**. **PortSentry** helps developers automatically discover, track, and manage listening local ports, view process metrics (CPU/Memory usage), and terminate processes (including child worker process trees) in one click to prevent orphaned ports.

---

## Key Features

*   🔍 **Real-Time Port Discovery**: Instantly scans your system for active port listeners (Dev servers, Databases, Web servers, System services).
*   📊 **Process Telemetry**: View live process stats including Memory (MB) and CPU (%) usage.
*   ⚡ **Process Tree Kill**: Kills process trees cleanly on Windows (`taskkill /F /T`) so orphaned sub-workers (like Vite/Next.js/Webpack servers) are terminated and ports are completely freed.
*   📥 **System Tray Minimization**: Minimize or close the app quietly to your Windows notification tray to keep it running in the background.
*   🔔 **System Notifications**: HTML5 desktop notifications alert you when a new local service goes live.
*   📋 **Clipboard Actions**: Quick copy button to copy service links (e.g. `http://localhost:3000`) directly to your clipboard.

---

## Getting Started

### Prerequisites

Make sure you have Node.js and Git installed on your system.

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/jojin1709/PortSentry.git
   cd PortSentry
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To run the application in development mode:
```bash
npm start
```

### Packaging (Build Standalone Executable)

To package the app into a portable standalone `.exe` installer (located in `dist/`):
```bash
npm run build
```

---

## Developer

Developed with ❤️ by **JOJIN JOHN**  
*   [LinkedIn Profile](https://www.linkedin.com/in/jojin-john/)
*   [Buy Me A Coffee](https://www.buymeacoffee.com/jojin1709)

---

## License

This project is proprietary and confidential. All rights are reserved to **JOJIN JOHN**. See [LICENSE](LICENSE) for details.
