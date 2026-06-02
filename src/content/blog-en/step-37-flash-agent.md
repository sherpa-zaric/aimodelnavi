---
title: "How Step-3.7 Flash Cuts Agent Costs to 1/9 of Claude Opus While Boosting Performance"
date: "2026-06-02"
tag: "AI Agent"
excerpt: "Step-3.7 Flash redefines the role of a 'Flash' model for the agent era, prioritizing production-ready features like high throughput, low cost, and robust tool calling over mere benchmark performance. With an active parameter count of just 11B, it achieves near-flagship coding capabilities at approximately 1/9th the per-task cost of Claude Opus 4.6. This makes it a foundational, agentic model designed for the high-frequency, multi-step demands of real-world AI agent workflows."
---

In 1492, Columbus sailed into the deep Atlantic. An ocean voyage certainly required speed, but what truly determined whether a fleet could reach its destination was whether the fresh water, food, hull, masts, and rigging could survive the long storms. It was this unsentimental engineering logic, not romance, that reshaped transoceanic trade. Later, the Dutch designed the "Fluyt" merchant ship: cheaper to build, requiring fewer crew, with a larger cargo hold, enabling stable return trips across the Atlantic. Ocean travel transformed from the lonely bravery of adventurers into a replicable, calculable, and expandable business.

Today's competition among AI models stands at a similar crossroads.


![画像](/images/blog/step-37-flash-agent/img-1.png)


过去，人们谈模型，习惯谈参数、榜单和峰值能力，但 APPSO 在使用 Claude Code、Codex 这类 coding agent 之后，明显感觉到当 AI Agent 开始走向生产环境，真正在乎的问题变得有些不一样了：能不能持续处理高频请求，能不能稳定调用工具，能不能理解复杂界面，能不能嵌入企业既有流程并长期运转。这些问题的答案，往往不在跑分榜单里。

Recently, StepFun officially released and open-sourced Step 3.7 Flash. As a next-generation Flash model designed for production-grade Agents, it primarily serves Agents, Coding, Search, and multimodal workflows. Its timing is spot-on at this juncture. What production-grade Agents need is no longer just speed and low cost, but even more importantly, reliability, ease of use, ease of deployment, and the ability to generate results within real-world workflows day after day.

## The Flash Model is No Longer a Flagship Alternative

In the past, Flash models were often seen as lightweight versions of flagship models, with their selling points being nothing more than speed and low cost. But as Agents become the core of workflows, the role of the Flash model has changed.


![画像](/images/blog/step-37-flash-agent/img-2.gif)


如果模型在多轮任务中容易偏离目标，无论是企业还是个人都很难放心采用。相反，一个模型若能在速度、成本、工具调用、多模态理解和生态兼容之间取得平衡，才有机会成为 Agent 系统真正可依赖的基础能力。某种意义上，Agent 时代要的 Flash 模型，已经从「更快的小模型」升级成了「生产效率最高的基座模型」。它既要够得着旗舰模型的能力上限，又要扛得住大规模 Agent 调用的效率压力。

Step 3.7 Flash's positioning is precisely the latter — a new generation of Agentic foundation model.

## The First Gate for a Production-Grade Agent: Understanding the Real Work Environment

大量 Agent 任务分布在复杂界面、办公文档、图表系统、浏览器页面、专业软件和内部工具之间。只擅长文本问答的 Agent，很难真正处理这些任务。Step 3.7 Flash 重点强化的，正是 原生多模态理解与执行能力。它可以理解 UI、图表、文档、图片和应用界面，也可以在复杂视觉问题中自主裁剪、放大、重读图像。遇到信息不确定的情况，模型还能主动发起搜索，并对文本和图像信息进行交叉验证。

这里有个反直觉的设计思路。对一个 11B 激活的 Flash 模型来说，把海量视觉知识硬塞进权重是不划算的。阶跃反其道而行：权重里只留最核心的推理引擎，把感知边界和世界知识外推到推理阶段，靠极快的速度，用「多看几眼、多查几遍」去换「参数本来不够用」的那部分能力。低延迟和高吞吐，到这里就不只是部署时的优势，直接变成了能力本身的一部分，巧妙且机智。比如在这个驾驶舱操作的演示中，用户只输入「如何起飞」，模型就会自动框选驾驶舱区域，识别仪表、按钮和关键操作信息，理解当前界面的操作逻辑，并生成分步骤教程。


![画像](/images/blog/step-37-flash-agent/img-3.gif)


这里的重点不止在于它能识别一张驾驶舱图片，更关键的是，它能把一个密集、陌生、强依赖上下文的视觉环境，转换成一个人可以照着做的任务指引。能看懂，和能教你动手，难度系数完全不一样。

我们还把 Step 3.7 Flash 接入了一套手机 GUI Agent 流程，并用一台 vivo 手机完成演示。手机通过 USB 连接 Mac，打开 ADB 调试授权后，终端就可以获取手机当前截图，并通过 scrcpy 同步显示手机画面。随后，脚本把这张截图发送给 Step 3.7 Flash， 让模型判断屏幕里正在发生什么。比如我们让 Step 3.7 Flash 看了一眼手机里的微信读书热搜榜。它不只是把页面上的字读出来，还能理解榜单结构：哪些是书名，哪些是封面，当前排名是多少，有多少人在读，推荐值又对应哪本书。这类能力的意义在于，Agent 面对的是真实 App，而不是整理干净的截图。它要先看懂页面，才有可能继续帮用户找书、比对热度、整理榜单，甚至执行下一步操作。


![画像](/images/blog/step-37-flash-agent/img-4.gif)


我们又把它放到美团小判官这样的页面里，让它处理一条商家申诉场景。页面里同时有用户评价、图片证据、商户回复，以及「用户更有理」「商家更有理」这样的处理按钮。对模型来说，这已经不是简单的 OCR，它是在理解一段业务流程：谁在投诉、争议点是什么、证据是什么、平台接下来允许做什么。多模态 Agent 要进入真实工作流，遇到的往往就是这种混合了文本、图片、判断和操作入口的界面。


![画像](/images/blog/step-37-flash-agent/img-5.gif)


换到 Blender 场景里，用户输入「怎么删除这个方块」，模型会识别 Blender 的界面结构、图层、工具栏和当前编辑状态，再给出删除指定方块的操作步骤。


![画像](/images/blog/step-37-flash-agent/img-6.gif)


再看应用界面设计分析。当用户要求模型说明「这些设计有什么有趣之处」，模型会识别不同图片中的信息内容，理解设计元素之间的关系，并生成专业分析。


![画像](/images/blog/step-37-flash-agent/img-7.gif)


## Step 3.7 Flash 另一项关键能力，是联网与视觉搜索增强

Agent 在真实业务里碰到的问题，往往牵扯动态信息、外部资料、多源证据，还有一堆残缺的输入。模型要是只啃自己肚子里那点知识，时效性和准确性上很容易翻车。「瑞石楼」这个演示就很典型。模型先从用户上传的图片里读出可见的线索，围绕这些线索生成检索词，用网页抓取工具去外面查资料，最后把图里的视觉信息和网上的文字信息拼成一个完整回答。


![画像](/images/blog/step-37-flash-agent/img-8.png)


搜索到这里，已经不是返回一串网页链接那么简单，模型是围着任务目标，主动去找、去筛、去对、去组织证据。这正是 Search Agent 和 Research Agent 真正需要的干活方式。官方提到，Step 3.7 Flash 在 SimpleVQA Search、V* (Python) 等复杂视觉任务 Benchmark 上，展现出接近更大规模旗舰模型的表现。这也意味着模型能够在信息不充分的情况下继续推进任务，并减少未经验证的回答。


![画像](/images/blog/step-37-flash-agent/img-9.png)


## Let 40 Agents Work Simultaneously — This Is the Right Way for Large Models to Get the Job Done

Agent 与普通聊天机器人的区别，在于调用密度更高。一次普通问答往往只有一轮交互，而 Agent 完成任务时，需要反复观察环境、调用工具和读取结果。Coding Agent 要读代码、改文件、运行命令；Search Agent 要检索、核对和整理信息；办公 Agent 要处理表格、文档和邮件。调用次数一旦大幅增加，模型速度和成本就会成为系统级问题。

Step 3.7 Flash 采用稀疏 MoE 架构，总参数为 196B 加 1.8B ViT，激活参数仅 11B，最高生成速度可达 400 Tokens/s。对于高频 Agent、Coding Agent、Search Agent、多模态 Agent 和企业知识工作 Agent，这意味着同样时间内可以完成更多轮观察、调用和推理。比如，Step 3.7 Flash 可以构建 Agent 集群，让 40 个不同身份的虚拟 persona 扮演产品评测团，对一个产品问题进行并行判断，并实时汇总它们对 5 个 MVP 方向的偏好。


![画像](/images/blog/step-37-flash-agent/img-10.gif)


批量跑 Agent 的价值，就在这里了。过去一个模型做一次分析，成本和延迟都还能忍。可一旦企业同时跑几十个 Agent，分别扮演用户、专家、销售、产品、运营、客服，吞吐能力立马成了前提。速度不够，反馈就慢；价格太高，规模化根本无法成立。类似地，Agent 并行实时构建大型知识图谱，同样属于高频、多步骤任务。模型价值不仅体现在生成速度，更体现在单位时间内完成更多观察、检索和推理。


![画像](/images/blog/step-37-flash-agent/img-11.gif)


再看信息整理。我丢给它一句「我要写一篇自动驾驶的综述，分头去查技术路线、政策法规、市场格局、代表公司四个方向」。这类任务看似只是汇总资料，实际运行时会触发多轮搜索、来源核对、内容归类和结构化输出。任务链条越长，调用次数越密，模型吞吐的差距就越容易被放大。


![画像](/images/blog/step-37-flash-agent/img-12.jpg)


Step 3.7 Flash 给我的直观感受是快，但快的同时质量没有打折 ——从全网搜集四个方向的资料各自归到对应板块，技术路线讲得清楚，政策法规和市场格局的信息也分得开，没有出现把不同方向揉成一团的情况，结构化输出该有的层级都在。


![画像](/images/blog/step-37-flash-agent/img-13.png)


值得一提的是，Step 3.7 Flash 完成任务的性价比极高，尤其是对 Agent 这种高频任务形态更友好。一次 Agent 任务往往包含拆解、检索、读网页、调工具、比对结果和整理输出，调用次数远高于普通问答。单次成本差异，放到完整任务链里会被迅速放大。官方数据显示，开启 Advisor Mode 后，Step 3.7 Flash 的编程能力达到 Claude Opus 4.6 的 97%，但每个任务成本大约只有后者的九分之一。


![画像](/images/blog/step-37-flash-agent/img-14.png)


也正因为如此，Step 3.7 Flash 的价值不能只用「快」来概括。放到 Agent 工作负载里看，它同时解决了三件事：高吞吐减少等待，更低任务成本支撑规模化运行，接近头部模型的编程能力则让它有机会进入真实工作流，承担持续、复杂的任务。

此外，Agent 要进入生产系统，关键还在于稳定调用工具。Step 3.7 Flash 在高可靠工具调用与编排上做了优化。官方称，它可以在长程多轮 Agent 工作流中稳定调用 API、浏览器、终端、Office 工具和外部系统，并保持任务轨迹一致，降低任务偏移和执行失败的概率。官方披露了几组数据。Step 3.7 Flash 在考察多工具协同的 Toolathlon 上达到 49.5%，在考察真实环境下日常自主任务执行的 ClawEval 1.1 上达到 67.1%，在横跨 44 种职业任务的 GDPval 上达到 45.8%。在 τ²-bench Telecom 的低、中、高三档推理难度下，通过率均超过 98%。

当然，Agent 生产化还有一个容易被低估的条件：模型必须适配工作流。模型通常被放进一套 harness 里，周围有提示词模板、工具协议、浏览器环境、文件系统、代码执行器、评测集、权限系统和业务流程。对此，Step 3.7 Flash 针对 Claude Code、Kilo Code、Roo Code、OpenCode、Hermes Agent、OpenClaw 等主流 Coding 和 Agent 工具做了兼容优化，也面向 MCP、Skills 等工具调用协议和开发链路进行适配。


![画像](/images/blog/step-37-flash-agent/img-15.png)


开发者因此可以更容易地把模型放进已有 Agent 框架中，而不必重新改造整套流程。对企业来说，适配价值不言而喻：模型越容易进入既有系统，试用和部署周期越短，工程成本越低。目前，Step 3.7 Flash 已在 Kilo Code、Nous Research、Lemonade 等 Agent 与开发者生态项目中完成接入验证。阶跃星辰也在与 Fireworks AI、DeepInfra、Modal Labs 等 AI 基础设施与推理平台推进适配，后续还会接入 OpenRouter、ZenMux 等海外模型聚合与开发者平台。


![画像](/images/blog/step-37-flash-agent/img-16.png)


🔗 https://huggingface.co/stepfun-ai/Step-3.7-Flash
截至目前，官方还提供关于 Step 3.7 Flash 的 Model Page、GitHub、Hugging Face、ModelScope、国内开放平台 API、海外开放平台 API、Studio 在线体验，以及阶跃 AI App 入口。这些入口意味着，它同时面向开发者试用、企业 API 接入和开源生态使用。更重要的是，Step 3.7 Flash 支持云端和本地部署。官方还提供了端侧多精度版本，面向个人工作站和本地环境进行优化。海外开发者的实测反馈，也补上了官方数据之外的视角。有人在本地 MoE 测试中对比 DeepSeek V4 Flash、Step 3.7 Flash 和 Minimax M2.7，Step 3.7 Flash 在 agg@64 下运行速度超越其它模型，达到 2123.13 tok/s；也有开发者提到，自己用 Gemini 3.5 Flash 写代码后，再让 Step 3.7 Flash 检查，能找出 7 个以上小 bug 和错误。无论是指向本地吞吐，还是指向代码排错，都切实地说明 Step 3.7 Flash 已经开始进入真实开发流程，并被开发者当成可以长期使用的生产力工具。


![画像](/images/blog/step-37-flash-agent/img-17.png)


## Foundation Models Should Be Born for Agents

体验完 Step 3.7 Flash，APPSO 发现它比起追求某个维度的跑分，更强调工程实用性。多模态、联网搜索、工具调用、框架兼容、本地部署、低成本、高吞吐。这些单拎出来都不算新鲜，可它们凑在一起，恰好补上了 Agent 在生产环境里最需要的短板。这条路径并不花哨，但很适合 Agent 当前所处的阶段。我们过去问一个模型，问的是它够不够聪明。可 Agent 时代，真正该问的是另一个问题：这个模型，是为谁设计的。

这两个提问背后的出发点就不一样。一个是模型为人优化，意味着它默认面对的是一个会读、会等、会自己脑补的人类。你问一句，它答一句，慢几秒没关系，偶尔含糊也能靠你补上。但 Agent 不会，Agent 要在观察、调用、推理、纠错的循环里连轴转，它一天发出的请求，可能比一个人一年说的话还多。它不会替模型打圆场，模型跑偏了，它就跟着跑偏。为人优化的模型，未必适合 Agent 。这也是为什么 Flash 这个词，在 Agent 时代有了新的含义。它不再只是旗舰的廉价替身，而要从头按 Agent 的脾气重新设计了一遍。Step 3.7 Flash 这些特点恰好对应了这个逻辑。原生多模态，是因为 Agent 得先看见任务现场；400 Tokens/s，是因为高频调用经不起慢；工具调用的稳定性，是因为长程任务断一环就全断；harness 适配，是因为模型再强，进不去现成的系统也白搭。它不是冲着榜单去的，是冲着「Agent 究竟怎么高效、高性价比干活」去的。从 Step 3.5 Flash 到 Step 3.7 Flash，阶跃星辰一路强化的，其实都是同一件事：让模型为 Agent 而生，推动 Agent 进入规模化商用。这也会成为模型今后一个重要的进化路线，Step 3.7 Flash 也还不是终点。但它让我们看到了一个变化：评判 Agent 时代的模型，不该只盯着它有多聪明，而要看它愿不愿意把那些琐碎的工程账，一笔一笔算明白。1492 年真正改变世界的，其实不是哥伦布那一次惊险的横渡，反而是后来那些福禄特商船能一趟趟稳稳地出海、返航、装货，然后再出发。冒险家负责抵达彼岸，商船负责让彼岸变成航线。模型竞争走到 Agent 这个阶段，道理也类似。真正拉开距离的，不只是跑分上的惊艳，更是那些能让 Agent 反复出发、可靠抵达，并把能力沉淀成航线的模型。