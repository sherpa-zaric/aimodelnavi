import fs from "fs";
import { detectChineseImages, replaceChineseImages } from "./lib/image-caption";

const jaFile = "src/content/blog/codex-deepseekv4-glm51-k26.md";
const enFile = "src/content/blog-en/codex-deepseekv4-glm51-k26.md";

const jaContent = fs.readFileSync(jaFile, "utf-8");
const title = "CodexにDeepSeek V4、GLM 5.1、K2.6を接続する方法";

async function main() {
  const chineseImages = await detectChineseImages(jaContent, title);
  console.log(`\nChinese images found: ${chineseImages.size}`);

  if (chineseImages.size > 0) {
    const jaReplaced = await replaceChineseImages(jaContent, chineseImages, title);
    fs.writeFileSync(jaFile, jaReplaced);
    console.log("JA file updated");

    const enContent = fs.readFileSync(enFile, "utf-8");
    const enReplaced = await replaceChineseImages(enContent, chineseImages, title);
    fs.writeFileSync(enFile, enReplaced);
    console.log("EN file updated");
  } else {
    console.log("No Chinese images to replace");
  }
}

main();
