---
title: "How to Connect DeepSeek, GLM, and Kimi to Codex: Two Practical Approaches"
date: "2026-06-03"
tag: "Open Source"
excerpt: "Connecting third-party LLMs like DeepSeek or GLM directly to Codex via an API key often fails due to a fundamental protocol mismatch. This guide explains the two main solutions: CC-Switch, a local proxy for protocol conversion, and Codex++, a desktop enhancer for configuration injection, helping you choose the right approach."
---

If you've tried to connect a third-party large language model like DeepSeek, GLM, or Kimi directly to Codex by simply pasting in an API key, you likely hit a wall. The problem isn't with your key or your account. It's a fundamental protocol mismatch—the tools can't communicate effectively.

To understand why, consider the current architecture. The latest Codex CLI and Codex App primarily use the **OpenAI Responses API**, while many third-party models offer an **OpenAI-compatible Chat Completions** interface. These aren't the same.

![](/images/blog/codex-deepseekv4-glm51-k26/img-1.webp)
*Diagram illustrating the protocol mismatch when connecting Codex to third-party models.*

The differences in message structures, streaming responses, `reasoning` fields, and tool call formats mean you can't just "swap the base URL and add a key." The real challenge is making Codex's outgoing requests understandable to the third-party service and converting its responses back into a format Codex can parse.

Currently, there are two primary community-driven solutions to bridge this gap:

- **CC-Switch**: A local proxy and protocol conversion approach.
- **Codex++**: A desktop-focused enhancement and configuration injection method for the Codex app.

Both enable third-party model access, but they operate at different layers. CC-Switch primarily handles protocol conversion at the proxy level, while Codex++ enhances the desktop UI and configuration management. For simply connecting a third-party model, **CC-Switch is generally the recommended starting point.**

---

## 1. The CC-Switch Route: A Low-Overhead Configuration & Proxy Solution

### 1.1 What is CC-Switch?

CC-Switch acts as a configuration hub and local routing proxy for multiple AI coding tools. Originally built for Claude Code, it has expanded to support Codex, Gemini CLI, and others. It's a well-regarded open-source project that has gained significant traction, nearing 90,000 GitHub stars.

![](/images/blog/codex-deepseekv4-glm51-k26/img-2.png)

In the Codex context, CC-Switch does two main things:

- **Configuration Management**: Unifies settings for different coding tools, allowing for preset switching, template imports, and supplier changes.
- **Local Proxying**: Runs an HTTP service on your machine to perform protocol conversion and route Codex requests to third-party models.

The core idea is simple: **Don't modify Codex itself—just change its configuration and run a proxy.**

### 1.2 Installation & Setup

Before starting, ensure Codex is configured to use an API Key/local configuration, not the ChatGPT login route, to avoid conflicting request paths. Also, run Codex at least once to initialize its configuration file.

1.  Visit the CC-Switch GitHub repository and download/install the application.
2.  Launch CC-Switch. Click the `+` in the top-right to add a supplier (we'll use DeepSeek as an example).

![](/images/blog/codex-deepseekv4-glm51-k26/img-3.png)
![](/images/blog/codex-deepseekv4-glm51-k26/img-4.png)
*Adding a supplier in CC-Switch.*

3.  Typically, you only need to enter the API Key. Ensure the `Needs Local Routing` toggle is enabled (it usually is by default).

![](/images/blog/codex-deepseekv4-glm51-k26/img-5.png)
*Entering the API Key in CC-Switch.*
![](/images/blog/codex-deepseekv4-glm51-k26/img-6.png)
*CC-Switch local routing configuration.*

4.  Return to the main screen, click the gear icon in the top-left, go to Settings, and enable "Routing." The total request count will show `0`—this number will help you verify if Codex traffic is being routed through CC-Switch.

> CC-Switch settings screen. After clicking the gear icon in the top-left and opening the "Routing" section, showing the local routing on/off toggle.
![](/images/blog/codex-deepseekv4-glm51-k26/img-8.png)
*Enabling local routing in CC-Switch.*

5.  Restart Codex, send a message, and verify you get a response.

![](/images/blog/codex-deepseekv4-glm51-k26/img-9.png)
*Codex replying using a third-party model via CC-Switch.*

6.  Back in CC-Switch's routing settings, if you see request logs, your setup is working.

![](/images/blog/codex-deepseekv4-glm51-k26/img-10.png)
*Request history in CC-Switch.*

---

## 2. The Codex++ Route: A Deeper Desktop Enhancement

### 2.1 What is Codex++?

Codex++ isn't a universal protocol proxy. It's better described as an external enhancement launcher for the Codex desktop app.

The version we'll focus on, `BigPizzaV3/CodexPlusPlus`, doesn't modify Codex's original files. Instead, it launches Codex through an external launcher and uses the Chromium DevTools Protocol (CDP) to inject enhancement scripts into the running Codex rendering process. Supplier configurations are managed by a separate tool and written to `~/.codex/config.toml`.

![](/images/blog/codex-deepseekv4-glm51-k26/img-11.png)

This represents a different focus than CC-Switch:

- **CC-Switch** solves *how requests are forwarded and protocols converted*.
- **Codex++** focuses on *how the desktop app is enhanced, how configurations are injected, and plugin interfaces are used*.

*(Note: A separate project, `b-nnett/codex-plusplus`, exists which injects a Loader by modifying `app.asar`. This guide refers to the BigPizzaV3 version.)*

### 2.2 Installation & Setup

1.  Go to the BigPizzaV3/CodexPlusPlus repository and download the installer for your OS.
2.  After installation, you'll find two new entries: `Codex++` (the launcher) and `Codex++ Manager` (the configuration tool).

![](/images/blog/codex-deepseekv4-glm51-k26/img-12.png)
*Entries after installing Codex++.*

3.  Launch the `Codex++ Manager`. Navigate to supplier configuration and add a supplier (e.g., DeepSeek):
    - **Access Mode**: Select "Pure API".
    - **Base URL**: Use the URL suggested by Codex++ or the model provider's docs. For DeepSeek, it's often `https://api.deepseek.com` or `https://api.deepseek.com/v1`.
    - **API Key**: Enter your key.
    - **Upstream Protocol**: Select `Chat Completions`.

![](/images/blog/codex-deepseekv4-glm51-k26/img-13.png)
*Adding a supplier in Codex++.*
![](/images/blog/codex-deepseekv4-glm51-k26/img-14.png)
*Configuring DeepSeek in Codex++.*

4.  Now, launch Codex **using the `Codex++` shortcut**. If Codex was already open, restart it via the shortcut or the restart button in the top-right. Using the original Codex shortcut will bypass the enhancement scripts.
5.  The enhanced interface will look like this:

![](/images/blog/codex-deepseekv4-glm51-k26/img-15.png)
*The Codex++ enhanced interface.*

### 2.3 What Does Codex++ Actually Do?

The enhancement scripts perform three key tasks:

1.  **Writes Third-Party Configuration**: Instead of intercepting all network traffic, it injects custom provider settings (like DeepSeek) into Codex's native configuration file (`~/.codex/config.toml`). This lets Codex use the provider natively.
2.  **Adds UI Entry Points**: After launching via Codex++, you'll see a Codex++ status/menu entry in the top menu bar of the app. However, supplier management still happens in the separate `Codex++ Manager`.
3.  **Unlocks Desktop Enhancements**: For example, in API Key mode, Codex's native plugin entry might demand a ChatGPT login. Codex++ unlocks this and adds features like session deletion, Markdown export, a timeline view, and provider synchronization.

![](/images/blog/codex-deepseekv4-glm51-k26/img-16.webp)

---

## 3. Under the Hood: The Core Technical Challenge

Despite their different approaches, both solutions tackle the same fundamental problem: ensuring Codex's requests and a third-party service's responses are mutually intelligible.

In API Key mode, Codex's flow roughly follows this path:

```
User Input -> Codex Agent Orchestrates Task -> Reads ~/.codex/config.toml ->
Finds Provider via model_provider -> Extracts base_url, API Key, wire_api ->
Sends Request to Model Service -> Receives Response -> Codex Parses Response ->
Continues Tool Calls, File Edits, Command Execution, etc.
```

Critical configuration fields include:
- `model_provider`: Which supplier to use.
- `base_url`: Where to send requests (OpenAI, a third-party proxy, or an internal gateway).
- `env_key`: The environment variable name for the API key (for security).
- `wire_api`: The communication protocol (e.g., `responses` or `chat`).

The `wire_api` is crucial. A basic chat interface returning a text response can't support Codex's agent workflow. Codex must parse streaming events, tool calls, reasoning output, and state fields to continue its autonomous actions (reading files, editing code, running commands).

![](/images/blog/codex-deepseekv4-glm51-k26/img-16.webp)

### 3.1 Why Just Changing the Base URL Doesn't Work

Codex favors the **OpenAI Responses API**, designed for stateful agent interactions. Many third-party models offer the **OpenAI-compatible Chat Completions API**, a stateless conversational interface. They are different protocols. Codex needs more than just `messages` and a model reply; it requires handling tool calls, streaming events, context, reasoning, and task state.

### 3.2 CC-Switch's Approach: Protocol Conversion at the Proxy Layer

CC-Switch's local proxy performs protocol translation:
- Converts Codex's Responses API requests into Chat Completions for the upstream model.
- Repackages the upstream model's SSE streaming responses back into Responses format for Codex.
- Manages `reasoning` content, tool calls, `previous_response_id`, and other state fields.

![](/images/blog/codex-deepseekv4-glm51-k26/img-17.webp)
*CC-Switch protocol conversion principle.*

Because of this conversion layer, stability depends on both the model's compatibility and the proxy's implementation. If the upstream model natively supports the Responses API, the proxy can skip a conversion step, mainly handling auth injection, usage tracking, and health checks.

### 3.3 Codex++'s Approach: Desktop-Side Enhancement & Config Injection

Codex++ focuses on **enhancing the Codex desktop app and managing provider configuration**. It doesn't funnel all requests through a local proxy for protocol conversion. Instead, it uses a launcher + CDP script injection to add UI elements, configuration menus, and supplier-switching capabilities directly to the Codex app experience.

**In short: CC-Switch solves "how to route requests and convert protocols." Codex++ solves "how to enhance the desktop UI and simplify provider configuration."**

---

## 4. Choosing Your Path: CC-Switch vs. Codex++

**The Bottom Line:** For most users just wanting to connect a third-party model, **CC-Switch is the recommended default.**

### 4.1 Decision Guide

![](/images/blog/codex-deepseekv4-glm51-k26/img-18.webp)
*CC-Switch vs. Codex++ selection advice.*

- **Use CC-Switch if:**
  - You primarily use Codex CLI.
  - You also use Claude Code, Gemini CLI, or other supported tools.
  - You want a non-invasive solution that doesn't touch Codex's core files.
  - You need reliable protocol conversion and local routing out of the box.
- **Consider Codex++ if:**
  - You exclusively use the Codex **desktop app**.
  - You specifically want UI enhancements, plugin entry points, and a integrated launcher/manager experience.

### 4.2 Feature Compatibility with Third-Party Models

When using a third-party model, not all Codex features will work perfectly. Here's a realistic expectation:

**Likely Incompatible / Hard to Replace:**
- **Image Generation**: Relies on OpenAI's native capability.
- **Computer Use**: Requires Responses API's built-in `computer action` type, local runtime, and screenshot feedback loop. Chat Completions and standard third-party models typically lack this.

**Degraded / Limited:**
- **General Skills/Plugins**: May work with Codex++ UI enhancements, but stability varies.
- **Tool Calling**: Basic code editing, file I/O, and command execution usually work. Complex tool calls or long-running tasks may encounter format and compatibility issues.

**Generally Functional:**
- Code writing
- Debugging and refactoring
- File read/write
- Project management
- Multi-turn conversation
- Task planning

### 4.3 Practical Usage Tips

- **For lightweight tasks**: Use cost-effective models like DeepSeek for code Q&A, text tasks, or simple scripts for significant savings.
- **For complex projects**: Use a more powerful model (like GPT-4) for initial planning, then delegate simpler sub-tasks to third-party models.
- **If your OpenAI plan has sufficient quota**: The native Codex experience remains the most stable and full-featured; additional tinkering may not be necessary.

---

*References:*
*[1] CC-Switch GitHub: https://github.com/farion1231/cc-switch*
*[2] BigPizzaV3/CodexPlusPlus: https://github.com/BigPizzaV3/CodexPlusPlus*
*[3] b-nnett/codex-plusplus: https://github.com/b-nnett/codex-plusplus*