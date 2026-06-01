---
title: "Why LLMs Struggle with Video Games: The Gap Between Coding and Dynamic Environments"
date: "2026-06-01"
tag: "AI Agent"
excerpt: "While LLMs excel at coding due to structured feedback, they struggle with the spatial reasoning and diverse rule sets of video games. This article explores the technical gap between static text processing and the dynamic 'World Models' required for gaming."
---

## The Struggle of LLMs in Dynamic Environments

Recent advancements in Large Language Models (LLMs) have revolutionized text generation and complex code synthesis. However, when these models are dropped into the dynamic environments of video games, their performance drops precipitously. Julian Togelius, Director of the NYU Game Innovation Lab and co-founder of Modl.ai, has noted that even with modern frameworks, the gameplay capabilities of LLMs are "absolutely suck," often performing worse than simple exploration algorithms.

Why is there such a stark contrast between an LLM's proficiency in coding and its failure in gaming? The answer lies in several critical technical bottlenecks.

## Coding vs. Gameplay: The Feedback Divide

LLMs excel at programming because coding is, in essence, a "controlled game of behavior." In software development, models receive immediate, granular feedback through compilation successes, error logs, and passed test cases. This tight feedback loop allows for rapid refinement.

Video games, however, present a set of hurdles that LLMs are not equipped to handle:

1. **Deficiency in Spatial Reasoning**: Since LLMs are primarily trained on text, they struggle with spatial awareness and the complex geometric reasoning essential for navigating 3D or 2D game worlds.
2. **Lack of Diverse Training Data**: Beyond a few hyper-popular titles, there is very little high-quality training data covering the specific mechanics of most games, leaving models unable to adapt to unfamiliar systems.
3. **The Generalization Problem**: Even specialized AI like Google's AlphaZero, which dominates Go and Chess, required specific retraining or architecture redesigns for each game. Because every video game has unique control schemes and rules, creating a single, general-purpose model for gaming remains an immense challenge.

## World Models and the Paradox of Complexity

For an AI to master a game, it must construct a "World Model"—a conceptual understanding of the environment's underlying rules. This is a strategy Waymo employs, for instance, within its autonomous driving training loops.

Interestingly, game environments are both simpler and more complex than the real world. In reality, the laws of physics are universal. In gaming, every title possesses its own unique physics and logic. Togelius suggests that tasks like autonomous driving are actually simpler than gaming in one specific sense: they do not have to contend with the sheer variety of rule sets found across different game titles.

## The State of AI Integration in Game Development

With the rise of tools like Cursor and Claude, generating a playable game from a prompt has become trivial. However, these tools are currently limited to producing "typical" games—simple clones like *Asteroids* or basic prototypes.

Creating a "great" or "innovative" game requires a process of iterative adjustment to the "game feel"—the tactile sensation of movement and interaction. Since current LLMs cannot playtest their own creations and adjust mechanics based on subjective feel, reaching a level of original, high-quality game design remains out of reach.

For developers integrating AI, the focus must shift. It is no longer about simple "automation of tasks," but rather about "agent design"—developing how an AI perceives its environment and how it constructs an effective feedback loop to interact with the world.