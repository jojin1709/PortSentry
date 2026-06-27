# Privacy & Security Policy - PortSentry

PortSentry is built with security and user privacy as core values. Because this utility monitors local ports and system processes, we maintain strict privacy policies.

---

## 1. 100% Local Data Processing
All data collected by PortSentry (active ports, process names, command-line paths, CPU/memory telemetry) is queried directly from your operating system and processed **locally on your machine**. 

*   **No Analytics**: PortSentry contains no tracking pixels, telemetry reporting tools, or analytics libraries.
*   **No External Servers**: Data is never sent to any external server, cloud database, or third-party service.
*   **Offline Support**: PortSentry functions completely offline and does not require an active internet connection to run.

---

## 2. Sandbox & Binding Security
*   **Localhost Only**: The backend server is strictly bound to the loopback interface (`127.0.0.1`). This prevents any external device on your local network (LAN) or the internet from querying your active ports or sending command requests (like process termination) to the PortSentry backend.
*   **Execution Scope**: Process termination (`taskkill`) commands are initiated solely at the request of the local user via the Electron graphical interface.

---

## 3. Contact & Concerns
If you have security concerns or wish to review the source code, the complete source is audit-ready and publicly available at [https://github.com/jojin1709/PortSentry](https://github.com/jojin1709/PortSentry).

Developed by **JOJIN JOHN** · [LinkedIn](https://www.linkedin.com/in/jojin-john/)
